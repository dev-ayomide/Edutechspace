// Edge Function: email a student a link to their certificate.
//
// The caller must own the certificate (or be an admin): it is read through RLS as the caller, so no one can
// trigger mail for someone else's certificate. The email carries links (download page + public verification),
// not an attachment: the PDF is generated in the browser from the certificate record.
// Sends at most one email every 10 minutes per certificate.
//
// Secrets: SITE_URL, RESEND_API_KEY, EMAIL_FROM (e.g. "RUNTech Space <certificates@yourdomain.com>").
// The provider (Resend) is isolated in this one function; swap sendMail() to change it.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

async function sendMail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM'), to, subject, html }),
  })
  return res.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'You must be signed in.' }, 401)

  let body: { certificate_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  const id = String(body.certificate_id ?? '')
  if (!UUID.test(id)) return json({ error: 'Unknown certificate.' }, 400)

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const siteUrl = Deno.env.get('SITE_URL')
  if (!url || !anonKey || !serviceKey || !siteUrl || !Deno.env.get('RESEND_API_KEY') || !Deno.env.get('EMAIL_FROM')) {
    return json({ error: 'Email is not configured.' }, 500)
  }

  const asCaller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } })
  const { data: cert } = await asCaller
    .from('certificates')
    .select('id, certificate_no, student_name, stack_name, revoked_at, emailed_at, user_id')
    .eq('id', id)
    .maybeSingle()
  if (!cert) return json({ error: 'Certificate not found.' }, 404)
  if (cert.revoked_at) return json({ error: 'This certificate has been revoked.' }, 400)
  if (cert.emailed_at && Date.now() - new Date(cert.emailed_at).getTime() < 10 * 60_000) {
    return json({ error: 'An email was sent a moment ago. Please check your inbox.' }, 429)
  }

  const { data: profile } = await asCaller.from('profiles').select('email').eq('id', cert.user_id).maybeSingle()
  if (!profile?.email) return json({ error: 'No email address on file.' }, 400)

  const base = siteUrl.replace(/\/$/, '')
  const verify = `${base}/verify/${encodeURIComponent(cert.certificate_no)}`
  const html = `<div style="font-family:Arial,sans-serif;color:#172554;max-width:560px">
    <h1 style="color:#1e3a8a">Congratulations, ${esc(cert.student_name)}!</h1>
    <p>You have completed <strong>${esc(cert.stack_name)}</strong> at RUNTech Space.</p>
    <p><a href="${base}/dashboard/certificate" style="background:#1e3a8a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Download your certificate</a></p>
    <p>Anyone can check that it is genuine at<br><a href="${verify}">${esc(verify)}</a><br>Certificate number: <strong>${esc(cert.certificate_no)}</strong></p>
  </div>`
  if (!(await sendMail(profile.email, 'Your RUNTech Space certificate', html))) {
    return json({ error: 'The email could not be sent. Please try again later.' }, 502)
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  await admin.from('certificates').update({ emailed_at: new Date().toISOString() }).eq('id', cert.id)
  return json({ status: 'sent' })
})

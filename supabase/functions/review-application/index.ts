// Edge Function: approve or reject a join application (stack leads of that stack, or admins).
//
// 1. Calls review_application() AS THE CALLER, so Postgres decides who may review.
//    - approve, new person        -> a student invitation is created; this function then sends the invite email
//    - approve, existing student  -> they are added to the stack directly (no email needed)
//    - reject                     -> recorded with the optional note, and a polite email is sent
//                                    (with the note as the reason) when RESEND_API_KEY and EMAIL_FROM are set
// 2. If the invitation email cannot be sent the application stays approved and the response says
//    emailSent: false so the reviewer can follow up.
//
// Secrets: SITE_URL, and optionally RESEND_API_KEY + EMAIL_FROM for rejection emails. SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
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

/** Best effort: returns false when no mail provider is configured or the send fails. */
async function sendRejection(to: string, name: string, stack: string, reason: string | null, siteUrl: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM')
  if (!key || !from) return false
  const html = `<div style="font-family:Arial,sans-serif;color:#172554;max-width:560px">
    <p>Hi ${esc(name)},</p>
    <p>Thank you for applying to join <strong>${esc(stack)}</strong> at RUNTech Space. We are not able to offer you a place this time.</p>
    ${reason ? `<p><strong>Note from the stack lead:</strong><br>${esc(reason)}</p>` : ''}
    <p>You are welcome to apply again later, to this stack or another one, at <a href="${siteUrl}/join">${esc(siteUrl)}/join</a>.</p>
    <p>RUNTech Space</p>
  </div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: `Your RUNTech Space application: ${stack}`, html }),
  }).catch(() => null)
  return !!res?.ok
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'You must be signed in.' }, 401)

  let body: { application_id?: unknown; approve?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  const applicationId = String(body.application_id ?? '')
  const approve = body.approve === true
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null
  if (!UUID.test(applicationId)) return json({ error: 'Unknown application.' }, 400)

  const siteUrl = Deno.env.get('SITE_URL')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!siteUrl || !url || !anonKey || !serviceKey) return json({ error: 'The server is not configured.' }, 500)

  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })

  // Readable only by the stack's leads and admins (RLS), so this doubles as an access check.
  const { data: application } = await asCaller.from('stack_applications').select('email, full_name, stacks(name)').eq('id', applicationId).maybeSingle()
  if (!application) return json({ error: 'Application not found.' }, 404)

  const { data: invitationId, error } = await asCaller.rpc('review_application', {
    p_application_id: applicationId,
    p_approve: approve,
    p_note: note,
  })
  if (error) {
    const forbidden = error.code === '42501'
    return json({ error: forbidden ? 'You cannot review this application.' : error.message }, forbidden ? 403 : 400)
  }
  if (!approve) {
    const stack = (application.stacks as { name?: string } | null)?.name ?? 'the stack'
    const emailSent = await sendRejection(application.email, application.full_name, stack, note, siteUrl.replace(/\/$/, ''))
    return json({ status: 'rejected', emailSent })
  }
  if (invitationId === null) return json({ status: 'added' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(application.email, {
    redirectTo: `${siteUrl.replace(/\/$/, '')}/accept-invite`,
  })
  return json({ status: 'approved', emailSent: !inviteError })
})

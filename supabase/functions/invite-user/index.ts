// Edge Function: invite a stack lead by email (admin only).
//
// 1. Calls create_lead_invitation() AS THE CALLER, so the database enforces "admins only".
//    - existing lead account  -> assigned to the stack directly, no email
//    - new email              -> pending invitation row created
// 2. For a pending invitation, sends the Supabase Auth invite email with the service role.
//    If sending fails the invitation is revoked so nothing is left half-done.
//
// Required secrets: SITE_URL (e.g. https://app.example.com). SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase. Deploy: supabase functions deploy invite-user
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'You must be signed in.' }, 401)

  let body: { email?: unknown; stack_id?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }
  const email = String(body.email ?? '').trim().toLowerCase()
  const stackId = String(body.stack_id ?? '')
  if (!EMAIL.test(email) || email.length > 254) return json({ error: 'Enter a valid email address.' }, 400)
  if (!UUID.test(stackId)) return json({ error: 'Choose a stack.' }, 400)

  const siteUrl = Deno.env.get('SITE_URL')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!siteUrl || !url || !anonKey || !serviceKey) return json({ error: 'The server is not configured.' }, 500)

  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data: invitationId, error } = await asCaller.rpc('create_lead_invitation', {
    p_email: email,
    p_stack_id: stackId,
  })
  if (error) {
    const forbidden = error.code === '42501'
    return json({ error: forbidden ? 'Only admins can invite stack leads.' : error.message }, forbidden ? 403 : 400)
  }
  if (invitationId === null) return json({ status: 'assigned' })

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl.replace(/\/$/, '')}/accept-invite`,
  })
  if (inviteError) {
    await asCaller.rpc('revoke_invitation', { p_invitation_id: invitationId })
    return json({ error: 'The invitation email could not be sent. Please try again.' }, 502)
  }
  return json({ status: 'invited', invitation_id: invitationId })
})

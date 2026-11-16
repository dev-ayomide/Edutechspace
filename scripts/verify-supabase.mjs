// Smoke-tests a live Supabase project using only the PUBLIC anon key (the same access any visitor has).
//   npm run setup:verify            (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env)
// Exit code is non-zero if any check FAILS. It never needs, and never prints, a secret.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env first.')
  process.exit(2)
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
console.log(`Checking ${new URL(url).host}\n`)

// A "blocked" result only counts if the server actually answered. Never let a dead connection look like a pass.
const reach = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } }).catch((e) => e)
if (reach instanceof Error || reach.status >= 500) {
  console.error(`Cannot reach ${new URL(url).host} (${reach instanceof Error ? reach.cause?.code ?? reach.message : reach.status}).`)
  console.error('Check VITE_SUPABASE_URL, your internet connection, and that the project is not paused.')
  process.exit(2)
}
// Newer projects answer 401 on the API root even with a valid key, so test the key on a real, public query.
const probe = await fetch(`${url}/rest/v1/stacks?select=id&limit=1`, { headers: { apikey: key } }).catch((e) => e)
if (!(probe instanceof Error) && (probe.status === 401 || probe.status === 403)) {
  const body = await probe.text().catch(() => '')
  if (/invalid api key|jwt|apikey/i.test(body)) {
    console.error('The server rejected the anon key. Check VITE_SUPABASE_ANON_KEY (use the "anon public" key, not a service key).')
    process.exit(2)
  }
}
const isNetwork = (error) => /fetch failed|network|ECONN|ENOTFOUND/i.test(error?.message ?? '')

const results = []
const record = (status, name, detail = '') => {
  results.push(status)
  const icon = { PASS: 'PASS', FAIL: 'FAIL', WARN: 'WARN' }[status]
  console.log(`${icon}  ${name}${detail ? `  (${detail})` : ''}`)
}
const check = async (name, fn) => {
  try {
    const [status, detail] = await fn()
    record(status, name, detail)
  } catch (e) {
    record('FAIL', name, e.message)
  }
}

await check('Database schema is installed and the 8 stacks are visible to visitors', async () => {
  const { data, error } = await sb.from('stacks').select('slug').eq('is_active', true)
  if (error) return ['FAIL', `${error.message}. Has the SQL setup been run?`]
  return data.length === 8 ? ['PASS', `${data.length} stacks`] : ['FAIL', `expected 8 stacks, found ${data.length}`]
})

await check('Visitors cannot read people (profiles)', async () => {
  const { data, error } = await sb.from('profiles').select('id').limit(1)
  return error && isNetwork(error) ? ['FAIL', error.message] : !error && data.length === 0 ? ['PASS'] : error ? ['PASS', 'blocked'] : ['FAIL', 'a visitor can read profiles']
})

await check('Visitors cannot read join applications', async () => {
  const { data, error } = await sb.from('stack_applications').select('id').limit(1)
  return error && isNetwork(error) ? ['FAIL', error.message] : error || data.length === 0 ? ['PASS'] : ['FAIL', 'a visitor can read applications']
})

await check('Visitors cannot self-approve an application', async () => {
  const { data: stacks } = await sb.from('stacks').select('id').limit(1)
  const { error } = await sb
    .from('stack_applications')
    .insert({ full_name: 'Smoke Test', email: 'smoke-test@example.invalid', stack_id: stacks?.[0]?.id, status: 'approved' })
  return error && isNetwork(error) ? ['FAIL', error.message] : error ? ['PASS', 'rejected by the database'] : ['FAIL', 'an approved application was created: delete it in the dashboard']
})

await check('Certificate verification works for unknown numbers (returns nothing)', async () => {
  const { data, error } = await sb.rpc('verify_certificate', { p_number: 'RTS-0000-NOTREAL000' })
  return error ? ['FAIL', error.message] : data.length === 0 ? ['PASS'] : ['FAIL', 'unexpected row']
})

await check('Admin functions are closed to visitors', async () => {
  const { error } = await sb.rpc('create_lead_invitation', { p_email: 'x@example.invalid', p_stack_id: '00000000-0000-0000-0000-000000000000' })
  return error && isNetwork(error) ? ['FAIL', error.message] : error ? ['PASS', 'denied'] : ['FAIL', 'a visitor could call an admin function']
})

await check('Latest database update is applied (extra attempts, profile details)', async () => {
  const { error } = await sb.rpc('attempt_overview', { p_user_id: '00000000-0000-0000-0000-000000000000', p_stack_id: '00000000-0000-0000-0000-000000000000' })
  if (error && isNetwork(error)) return ['FAIL', error.message]
  if (error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message)))
    return ['FAIL', 'paste supabase/migrations/20261115000001_attempt_grants_and_profile_details.sql into the SQL editor and run it']
  return error ? ['PASS', 'installed and closed to visitors'] : ['FAIL', 'a visitor could call attempt_overview']
})

await check('Private file buckets are not listable by visitors', async () => {
  for (const b of ['lesson-media', 'submissions']) {
    const { data, error } = await sb.storage.from(b).list('', { limit: 1 })
    if (error && isNetwork(error)) return ['FAIL', error.message]
    if (data && data.length > 0) return ['FAIL', `${b} lists files to visitors`]
  }
  return ['PASS']
})

await check('Public sign-up is switched OFF', async () => {
  const email = `smoke-${Math.random().toString(36).slice(2)}@example.invalid`
  const { data, error } = await sb.auth.signUp({ email, password: `S${Math.random().toString(36).slice(2)}!x9Qz` })
  if (error) return /not allowed|disabled|signup/i.test(error.message) ? ['PASS', 'sign-ups disabled'] : ['WARN', error.message]
  return data.user ? ['FAIL', `sign-up is ENABLED and created ${email}. Turn it off in Authentication > Sign In / Providers, then delete that user`] : ['WARN', 'unclear']
})

for (const fn of ['invite-user', 'review-application', 'send-certificate-email']) {
  await check(`Edge Function "${fn}" is deployed and requires sign-in`, async () => {
    const res = await fetch(`${url}/functions/v1/${fn}`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: '{}' })
    if (res.status === 404) return ['FAIL', 'not deployed yet']
    return res.status === 401 ? ['PASS', 'deployed'] : ['WARN', `status ${res.status}`]
  })
}

const failed = results.filter((r) => r === 'FAIL').length
const warned = results.filter((r) => r === 'WARN').length
console.log(`\n${results.length - failed - warned} passed, ${warned} warnings, ${failed} failed`)
process.exit(failed ? 1 : 0)

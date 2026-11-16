# Connect your subdomain

About 15 minutes of clicking, plus waiting for DNS. The examples use `learn.yourdomain.com`; use your real subdomain.

## 1. Keep one Vercel project
You have two Vercel projects building this repo (`edutechspace` and `edutechspace-g6l8`). Pick one, normally `edutechspace`.
In the other one, open **Settings > General**, scroll down and click **Delete Project**. Two projects means two builds per change and two addresses to confuse people.

In the one you keep, check **Settings > Environment Variables** has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for **Production**.

## 2. Add the subdomain in Vercel
1. Open the project, then **Settings > Domains > Add Domain**.
2. Type `learn.yourdomain.com` and click **Add**. If Vercel offers to also add `www.`, say no (that is only for the main domain).
3. Vercel shows one DNS record to create, something like:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `learn` | `cname.vercel-dns.com` (copy the exact value Vercel shows) |

## 3. Add the DNS record where your domain is managed
Wherever the main domain's DNS lives (Cloudflare, Namecheap, GoDaddy, Whogohost, the university's IT…), add exactly the record from step 2.
- If it is **Cloudflare**, set the record's proxy to **DNS only** (grey cloud). Vercel issues its own certificate.
- Do not touch the main domain's existing records.

Back in Vercel, the domain turns to **Valid Configuration** within minutes (sometimes up to a few hours). HTTPS is set up automatically.

## 4. Redeploy once
**Deployments**, open the latest Production deployment, **⋯ > Redeploy**.
The build reads the new address automatically, so link previews (WhatsApp, LinkedIn, X), the sitemap and search engines all use the subdomain. Nothing to edit in the code.
(If you ever want a different address in previews, set `VITE_SITE_URL=https://learn.yourdomain.com` in the Environment Variables.)

## 5. Tell Supabase the new address (important)
Without this, invitation and password-reset emails link to the wrong place.
1. **Authentication > URL Configuration**
   - **Site URL**: `https://learn.yourdomain.com`
   - **Redirect URLs**, add: `https://learn.yourdomain.com/accept-invite` and `https://learn.yourdomain.com/reset-password`
2. **Edge Functions > Secrets**: set `SITE_URL` to `https://learn.yourdomain.com` (no slash at the end).

## 6. Check it
- Open `https://learn.yourdomain.com`, then `/stacks/frontend`. The curriculum should show.
- Paste the address into a WhatsApp chat to yourself: a preview card with the RUNTech Space image should appear (it can take a day for apps that cached the old preview).
- In a terminal: `npm run setup:verify` should say all PASS once the Edge Functions are deployed.

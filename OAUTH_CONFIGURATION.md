# Google OAuth Configuration Guide

This guide will help you configure Google OAuth authentication to work properly on both local development and production environments.

## Prerequisites

- Supabase project set up
- Google Cloud Console account
- Your application deployed (for production)

## Step 1: Configure Supabase Dashboard

### 1.1 Set Site URL

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **URL Configuration**
3. Set the **Site URL** to your production domain:
   ```
   https://edutechspace-p.vercel.app
   ```

### 1.2 Add Redirect URLs

In the same **URL Configuration** section, add the following **Redirect URLs**:

**For Production:**
```
https://edutechspace-p.vercel.app/auth/callback
https://edutechspace-p.vercel.app/*
```

**For Local Development:**
```
http://localhost:5173/auth/callback
http://localhost:5173/*
http://127.0.0.1:5173/auth/callback
http://127.0.0.1:5173/*
```

**Important Notes:**
- The wildcard `/*` allows any path on your domain (required for dynamic redirects)
- Add both `localhost` and `127.0.0.1` for local development
- The `/auth/callback` path is the specific handler for OAuth callbacks
- Make sure to click **Save** after adding URLs

### 1.3 Enable Google Provider

1. Go to **Authentication** → **Providers**
2. Find **Google** and click to configure
3. Enable the Google provider
4. You'll need to add Google OAuth credentials (see Step 2)

## Step 2: Configure Google Cloud Console

### 2.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode

### 2.2 Create OAuth Client ID

1. Application type: **Web application**
2. Name: `EdutechSpace` (or your app name)
3. **Authorized JavaScript origins:**
   ```
   https://edutechspace-p.vercel.app
   http://localhost:5173
   http://127.0.0.1:5173
   ```

4. **Authorized redirect URIs:**
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   
   **To find your Supabase project ref:**
   - Go to Supabase Dashboard → Settings → API
   - Your project URL will be: `https://[PROJECT_REF].supabase.co`
   - The redirect URI format is: `https://[PROJECT_REF].supabase.co/auth/v1/callback`

5. Click **Create**
6. **Copy the Client ID and Client Secret** (you'll need these for Supabase)

### 2.3 Add Redirect URIs to Supabase

1. Go back to Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret** from Google Cloud Console
3. Click **Save**

## Step 3: Environment Variables

### 3.1 Local Development (.env.local)

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3.2 Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Step 4: Verify Configuration

### 4.1 Test Local Development

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:5173/login`
3. Click "Continue with Google"
4. After authentication, you should be redirected to `/auth/callback` then to `/course`

### 4.2 Test Production

1. Deploy your application
2. Navigate to `https://edutechspace-p.vercel.app/login`
3. Click "Continue with Google"
4. After authentication, you should be redirected correctly

## Troubleshooting

### Issue: Redirect goes to root URL (`/`) instead of `/auth/callback`

**Solution:**
- Make sure `/auth/callback` is in your Supabase Redirect URLs
- Add the wildcard `/*` to allow all paths
- Check that your Site URL is set correctly in Supabase

### Issue: "redirect_uri_mismatch" error

**Solution:**
- Verify the redirect URI in Google Cloud Console matches exactly:
  `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or typos

### Issue: OAuth works locally but not in production

**Solution:**
- Verify production domain is added to Supabase Redirect URLs
- Check that environment variables are set in Vercel
- Ensure Google Cloud Console has production domain in authorized origins

### Issue: "Invalid client" error

**Solution:**
- Double-check Client ID and Client Secret in Supabase Dashboard
- Make sure you copied the correct credentials from Google Cloud Console
- Verify the OAuth consent screen is properly configured

## Important Notes

1. **Supabase handles the OAuth flow**: Your app redirects to Supabase, which then redirects to Google, and Google redirects back to Supabase, which finally redirects to your app.

2. **Redirect flow:**
   ```
   Your App → Supabase → Google → Supabase → Your App (/auth/callback)
   ```

3. **The `redirectTo` parameter** in your code tells Supabase where to send users after authentication, but Supabase must have that URL in its allowed list.

4. **For production**, always use HTTPS URLs in all configurations.

5. **Test thoroughly** in both local and production environments before going live.

## Quick Checklist

- [ ] Supabase Site URL set to production domain
- [ ] Supabase Redirect URLs include `/auth/callback` and `/*` for both local and production
- [ ] Google OAuth credentials created
- [ ] Google Cloud Console has Supabase callback URL
- [ ] Google Cloud Console has your app domains in authorized origins
- [ ] Supabase Google provider enabled with Client ID and Secret
- [ ] Environment variables set in both local and Vercel
- [ ] Tested locally
- [ ] Tested in production



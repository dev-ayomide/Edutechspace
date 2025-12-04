# Quick Start Guide

Get your Edutechspace platform up and running in minutes!

## 🚀 Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get these from:** Supabase Dashboard > Settings > API

### 3. Create Database Tables

**In Supabase Dashboard:**

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `database/schema.sql`
4. Paste and click **Run**

✅ This creates all tables, policies, and sample data!

### 4. Create Storage Bucket

**In Supabase Dashboard:**

1. Go to **Storage**
2. Click **Create Bucket**
3. Name: `pdf-resources`
4. Make it **Public**
5. Click **Create**

### 5. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

## ✨ That's It!

Your platform is now ready. You can:

- ✅ Sign up / Login
- ✅ Browse courses
- ✅ Enroll in courses
- ✅ Take exams
- ✅ Access admin panel (if you set your role to 'admin' in Supabase)

## 🔧 Making Yourself Admin

**In Supabase SQL Editor, run:**

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

Then log out and log back in.

## 📚 Next Steps

- Upload course resources via Admin Dashboard
- Customize courses in Supabase Table Editor
- Configure Google OAuth (optional) in Supabase Dashboard

## 📖 Full Documentation

- See `README.md` for complete documentation
- See `SUPABASE_SETUP.md` for detailed database setup

---

**Need help?** Check the troubleshooting section in README.md


# Edutechspace - Online Learning Platform

A modern, full-featured online learning platform built with React, Vite, and Supabase. Features course management, user authentication, progress tracking, and certification exams.

## 🚀 Features

- **User Authentication**: Email/password and Google OAuth authentication via Supabase
- **Course Management**: Multiple tech courses (Frontend, Backend, Cybersecurity, AI, ML, Data Science, UI/UX)
- **Progress Tracking**: Track course progress and completion
- **Certification Exams**: Take certification exams for completed courses
- **Admin Dashboard**: Upload course resources (videos and PDFs) and manage courses
- **User Dashboard**: Personalized dashboard with progress tracking and goal setting
- **Responsive Design**: Modern UI built with Tailwind CSS and Framer Motion

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router v7
- **State Management**: React Context API
- **Icons**: Heroicons, Lucide React
- **Notifications**: React Toastify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account ([sign up here](https://supabase.com))
- Google Cloud Console account (for OAuth)

## 🔧 Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd Edutechspace
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Getting Your Supabase Credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select an existing one
3. Go to Settings > API
4. Copy the Project URL and anon/public key

### 3. Database Setup

**Option A: Using Supabase SQL Editor (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `database/schema.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter/Cmd+Enter)
7. Verify tables were created by checking **Table Editor**

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the schema
supabase db push
```

### 4. Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **Create Bucket**
3. Name: `pdf-resources`
4. Make it **Public**
5. Click **Create Bucket**

### 5. Configure Google OAuth (Optional)

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials from Google Cloud Console
4. Add redirect URIs:
   - Development: `http://localhost:5173/course`
   - Production: `https://yourdomain.com/course`

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📊 Database Schema

The application uses the following main tables:

- **users** - User profiles linked to Supabase Auth
- **courses** - Course information and metadata
- **courses_enrolled** - User course enrollments and progress
- **course_resources** - Course materials (videos, PDFs, links)
- **exams** - Certification exam metadata
- **exam_questions** - Exam questions and answers
- **exam_results** - User exam results and scores
- **user_goals** - User learning goals

All tables have Row Level Security (RLS) enabled with appropriate policies.

## 🔐 Authentication & Authorization

### User Roles

- **user**: Default role for regular users
- **admin**: Admin role for managing course resources and courses

### Making a User Admin

In Supabase Dashboard:
1. Go to **Table Editor** > **users**
2. Find your user record
3. Edit the `role` field
4. Change from `'user'` to `'admin'`
5. Save

Or use SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 📚 Course Features

### Available Courses

- Frontend Development
- Backend Development
- Cybersecurity
- Data Science
- UI/UX Design
- Artificial Intelligence
- Machine Learning

### Enrolling in Courses

Users can enroll in courses from the Course Database page. Enrollment is automatically tracked and progress is saved.

### Course Resources

- **Videos**: Upload video URLs (YouTube, Vimeo, etc.)
- **PDFs**: Upload PDF files to Supabase Storage
- **Links**: External resource links

## 🎯 Admin Features

Admin users can access:

- **Admin Dashboard**: `/admin/dashboard` - View statistics and quick actions
- **Resource Upload**: `/admin/resources/upload` - Upload course resources (videos and PDFs)
- **Course Management**: Manage courses, view enrollments, etc.

## 🧪 Certification Exams

Users can take certification exams after completing courses:

- Access exams from `/certification-exam`
- Each exam has a time limit and passing score
- Results are saved to the database
- Users can retake exams

## 📁 Project Structure

```
Edutechspace/
├── src/
│   ├── admin/              # Admin pages and layouts
│   ├── component/          # Reusable components
│   │   ├── dialog/         # Modal dialogs
│   │   └── ...
│   ├── context/            # React contexts (Auth)
│   ├── ExamPages/          # Exam pages and data
│   ├── layout/             # Layout components
│   ├── pages/              # Page components
│   ├── stacks/             # Course stack pages
│   └── utils/              # Utility functions (Supabase client)
├── database/
│   └── schema.sql          # Complete database schema
├── public/                 # Static assets
└── package.json
```

## 🔒 Security Features

- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- Protected routes and admin authorization
- Secure authentication via Supabase
- Automatic session management

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Create a new site in [Netlify](https://netlify.com)
3. Connect your repository
4. Add environment variables
5. Build command: `npm run build`
6. Publish directory: `dist`

**Important**: Update your Google OAuth redirect URIs in Google Cloud Console to include your production domain!

## 🐛 Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and anon key in `.env.local`
- Check that the database schema has been run
- Ensure RLS policies are correctly set up
- Restart the development server after changing env variables

### Authentication Issues

- Verify Google OAuth is enabled in Supabase Dashboard
- Check that redirect URIs are properly configured
- Ensure Supabase Auth is enabled in your project settings

### Storage Issues

- Verify the `pdf-resources` bucket exists
- Check storage policies are set correctly
- Ensure bucket is set to public if needed

### Exam Not Loading

- Verify exams table has data
- Check exam_type and course_type mappings
- Ensure exam_questions table has questions for the exam

## 📝 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📄 License

This project is private and proprietary.

## 👥 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using React, Vite, and Supabase

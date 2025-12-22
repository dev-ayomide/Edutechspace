import { Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthProvider';
import MainLayout from './layout/MainLayout';
import LoadingPage from './pages/LoadingPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/signup';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import AuthCallback from './pages/AuthCallback';
import Course from './pages/Course';
import CourseDatabase from './pages/courseDatabase';
import Contact from './pages/contact';
import Profile from './pages/Profile';
import AboutUs from './pages/AboutUs';
import NotFound from './component/NotFoundPage';
import CertificateExam from './pages/CertificationExam';
import ExamPage from './ExamPages/ExamPage';
import CyberSecurityStack from './stacks/CyberSecurityStack';
import FrontendDevStack from './stacks/FrontendDevStack';
import BackendDevStack from './stacks/BackendDevStack';
import DataScienceStack from './stacks/DataScienceStack';
import UiUxStack from './stacks/UiUxStack';
import MLStack from './stacks/MLStack';
import AiStack from './stacks/AiStack';
import UserDashboard from './pages/Dashboard';
import LessonView from './pages/LessonView';
import ProtectedRoute from './component/ProtectedRoute';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import ResourceUpload from './admin/pages/ResourceUpload';
import AdminCourses from './admin/pages/AdminCourses';
import AdminCourseForm from './admin/pages/AdminCourseForm';
import AdminResources from './admin/pages/AdminResources';
import AdminExams from './admin/pages/AdminExams';
import AdminUsers from './admin/pages/AdminUsers';
import ModuleManager from './admin/pages/ModuleManager';
import LessonManager from './admin/pages/LessonManager';
import { isSupabaseConfigured } from './utils/supabase';

const App = () => {
  const { loading, isInitializing } = useContext(AuthContext);

  // Allow auth callback pages to render immediately without waiting for initialization
  // Also check for OAuth code parameter on root path (fallback for misconfigured redirects)
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthCode = urlParams.get('code') !== null;
  const isAuthCallbackPath = window.location.pathname === '/auth/callback' ||
    window.location.pathname === '/verify-email' ||
    window.location.pathname === '/reset-password' ||
    (window.location.pathname === '/' && hasOAuthCode);

  // Show loading screen during initial auth check to prevent flash
  // But skip for auth callback pages that need to handle tokens
  if (isInitializing && !isAuthCallbackPath) {
    return <LoadingPage />;
  }

  // Show error message if Supabase is not configured
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Configuration Error</h1>
          <p className="text-gray-700 mb-4">
            Supabase environment variables are not configured. Please set up your environment variables.
          </p>
          <div className="bg-gray-50 p-4 rounded mb-4">
            <p className="text-sm font-semibold mb-2">Create a <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code> file in the root directory with:</p>
            <pre className="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
              {`VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
            </pre>
          </div>
          <p className="text-sm text-gray-600">
            See <code className="bg-gray-200 px-2 py-1 rounded">SETUP_GUIDE.md</code> for detailed instructions.
          </p>
        </div>
      </div>
    );
  }

  // Don't block rendering with loading - let routes handle their own loading states
  // This prevents blank pages during navigation

  return (
    <Routes>
      {/* Admin login outside MainLayout */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<EmailVerification />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="coursedatabase" element={<CourseDatabase />} />
        <Route path="course/frontendcourse" element={<FrontendDevStack />} />
        <Route path="course/backendcourse" element={<BackendDevStack />} />

        {/* Protected Routes (require authentication) */}
        <Route element={<ProtectedRoute />}>
          <Route path="course" element={<Course />} />
          <Route path="course/:courseId/lesson/:lessonId" element={<LessonView />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="course/cybersecuritycourse" element={<CyberSecurityStack />} />
          <Route path="course/datasciencecourse" element={<DataScienceStack />} />
          <Route path="course/mlcourse" element={<MLStack />} />
          <Route path="course/uiuxcourse" element={<UiUxStack />} />
          <Route path="course/aicourse" element={<AiStack />} />
          <Route path="contact" element={<Contact />} />
          <Route path="certification-exam" element={<CertificateExam />} />
          <Route path="certification-exam/:examType" element={<ExamPage />} />
        </Route>

        {/* Catch-all for Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin Routes - outside MainLayout for cleaner admin UI */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/create" element={<AdminCourseForm />} />
        <Route path="courses/edit/:id" element={<AdminCourseForm />} />
        <Route path="courses/:courseId/modules" element={<ModuleManager />} />
        <Route path="modules/:moduleId/lessons" element={<LessonManager />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="resources/upload" element={<ResourceUpload />} />
        <Route path="resources/edit/:id" element={<ResourceUpload />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
};

export default App;
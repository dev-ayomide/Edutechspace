import React, { useState, useEffect, useContext } from "react";
import { UserCircleIcon, CheckCircleIcon, BookOpenIcon, FlagIcon, ClockIcon } from "@heroicons/react/24/solid";
import { AuthContext } from "../context/AuthProvider";
import { toast } from "react-toastify";
import { supabase } from "../utils/supabase";
import UserGoalDialog from "../component/dialog/UserGoalDialog";
import CourseProgress from "../component/CourseProgress";
import LoadingPage from "./LoadingPage";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  const { user, loading: authLoading, fetchProfile } = useContext(AuthContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [courseProgress, setCourseProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!user && !authLoading) {
          await fetchProfile();
        }

        if (user && user.id) {
          // Fetch course progress from Supabase
          const { data, error: fetchError } = await supabase
            .from('courses_enrolled')
            .select(`
              *,
              courses (
                id,
                title,
                description,
                image_url
              )
            `)
            .eq('user_id', user.id)
            .order('enrolled_at', { ascending: false });

          if (fetchError) {
            throw fetchError;
          }

          // Transform data to match component expectations
          const transformedProgress = (data || []).map(enrollment => ({
            course_id: enrollment.course_id,
            course_name: enrollment.courses?.title || 'Unnamed Course',
            completed: enrollment.completed || false,
            progress: enrollment.progress || 0,
            enrolled_at: enrollment.enrolled_at,
            completed_at: enrollment.completed_at,
          }));

          setCourseProgress(transformedProgress);
        }
      } catch (err) {
        const errorMsg = err.message || "Failed to load dashboard data";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, authLoading, fetchProfile]);

  if (loading || authLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-20">Error: {error}</div>;
  }

  if (!user) {
    return <div className="text-gray-500 text-center mt-20">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile */}
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border-slate-900 border-[1px]">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Hi there, {user.name || "John Doe"} 👋</h2>
            <p className="text-gray-500 text-sm mt-1">
              Welcome back! Continue your learning journey and keep up your great work.🚀
            </p>
          </div>
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-20 h-20 object-cover rounded-full border-4 border-gray-300"
            />
          ) : (
            <UserCircleIcon className="text-blue-950 outline-gray-500 w-40 h-40" />
          )}
        </div>

        {/* Right Panel: Weekly Goals */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col border-slate-900 border-[1px]">
          <div className="flex items-center space-x-3">
            <FlagIcon className="text-blue-950 w-8 h-8" />
            <h2 className="text-xl font-semibold">Set Your Weekly Goal</h2>
          </div>
          <p className="text-gray-600 mt-2">Plan your weekly learning schedule and track your progress.</p>
          <div className="flex items-center space-x-2 mt-4">
            <ClockIcon className="text-gray-500 w-5 h-5" />
            <p className="text-gray-700">Recommended study time: 5h/week</p>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="bg-blue-950 text-white px-4 py-2 rounded-md mt-4 w-full"
          >
            Set Weekly Goal
          </button>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <CourseProgress progressData={courseProgress} />
      </div>

      {/* Completed Courses Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Completed Courses</h2>
        {courseProgress.filter((p) => p.completed).length > 0 ? (
          courseProgress
            .filter((p) => p.completed)
            .map((course) => (
              <div key={course.course_id} className="flex items-center space-x-4 mb-2">
                <CheckCircleIcon className="text-green-500 w-6 h-6" />
                <p className="text-gray-700">{course.course_name || "Unnamed Course"} - Certified</p>
              </div>
            ))
        ) : (
          <p className="text-gray-600">No courses completed yet.</p>
        )}
      </div>

      {/* Explore Courses Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Explore Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={"/course/cybersecuritycourse"}
            className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg cursor-pointer transition-shadow duration-300"
          >
            <BookOpenIcon className="text-blue-950 w-10 h-10" />
            <p className="mt-2 font-medium">Cybersecurity</p>
          </Link>
          <Link
            to={"/course/mlcourse"}
            className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg cursor-pointer transition-shadow duration-300"
          >
            <BookOpenIcon className="text-blue-950 w-10 h-10" />
            <p className="mt-2 font-medium">Machine Learning</p>
          </Link>
          <Link
            to={"/course/backendcourse"}
            className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col items-center hover:shadow-lg cursor-pointer transition-shadow duration-300"
          >
            <BookOpenIcon className="text-blue-950 w-10 h-10" />
            <p className="mt-2 font-medium">Backend Development</p>
          </Link>
        </div>
      </div>

      {/* Latest Updates Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">Latest Updates</h2>
        <p className="text-gray-600">📢 New Cybersecurity course added!</p>
        <p className="text-gray-600">⚡ AI Certification Exam available.</p>
      </div>

      {/* Weekly Goal Dialog */}
      {isDialogOpen && <UserGoalDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />}
    </div>
  );
};

export default UserDashboard;
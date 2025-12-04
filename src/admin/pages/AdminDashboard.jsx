import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { AuthContext } from '../../context/AuthProvider';
import { toast } from 'react-toastify';
import {
  DocumentArrowUpIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ArrowRightIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import RecentActivity from '../components/RecentActivity';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalResources: 0,
    totalExams: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [coursesRes, resourcesRes, examsRes, usersRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('course_resources').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalCourses: coursesRes.count || 0,
        totalResources: resourcesRes.count || 0,
        totalExams: examsRes.count || 0,
        totalUsers: usersRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpenIcon,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/courses',
    },
    {
      name: 'Total Resources',
      value: stats.totalResources,
      icon: DocumentArrowUpIcon,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/admin/resources',
    },
    {
      name: 'Total Exams',
      value: stats.totalExams,
      icon: ClipboardDocumentListIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/admin/exams',
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/admin/users',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || user?.email?.split('@')[0]}!</h1>
            <p className="text-blue-100 text-sm mt-1">Here's what's happening with your platform today.</p>
          </div>
          <ChartBarIcon className="h-8 w-8 text-blue-300 opacity-50 hidden md:block" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              to={card.link}
              className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.bgColor} rounded-lg p-2 group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`h-5 w-5 ${card.textColor}`} />
                  </div>
                  <ArrowRightIcon className={`h-4 w-4 ${card.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-0.5">{card.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            <p className="text-xs text-gray-600 mt-0.5">Common tasks and shortcuts</p>
          </div>
          <div className="p-4 space-y-2">
            <Link
              to="/admin/resources/upload"
              className="group flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-md transition-all duration-200 border border-blue-200"
            >
              <div className="flex items-center space-x-2.5">
                <div className="bg-blue-500 rounded-md p-1.5">
                  <DocumentArrowUpIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Upload Resource</p>
                  <p className="text-xs text-gray-600">Add PDF or video content</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>

            <Link
              to="/admin/exams/create"
              className="group flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-md transition-all duration-200 border border-green-200"
            >
              <div className="flex items-center space-x-2.5">
                <div className="bg-green-500 rounded-md p-1.5">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Create Exam</p>
                  <p className="text-xs text-gray-600">Set up a new certification exam</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>

            <Link
              to="/admin/courses/create"
              className="group flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-md transition-all duration-200 border border-purple-200"
            >
              <div className="flex items-center space-x-2.5">
                <div className="bg-purple-500 rounded-md p-1.5">
                  <BookOpenIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add Course</p>
                  <p className="text-xs text-gray-600">Create a new learning course</p>
                </div>
              </div>
              <ArrowRightIcon className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
            <p className="text-xs text-gray-600 mt-0.5">Latest platform updates</p>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

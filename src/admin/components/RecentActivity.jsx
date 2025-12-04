import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import {
  BookOpenIcon,
  DocumentArrowUpIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  UserIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent activities from multiple tables
      const [coursesRes, resourcesRes, examsRes, usersRes] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('course_resources')
          .select('id, title, created_at, course_type, resource_type')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, name, created_at, exam_type')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('users')
          .select('id, name, email, created_at, role')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const allActivities = [];

      // Process courses
      if (coursesRes.data) {
        coursesRes.data.forEach((course) => {
          allActivities.push({
            id: `course-${course.id}`,
            type: 'course',
            action: 'created',
            title: course.title,
            timestamp: course.created_at,
            icon: BookOpenIcon,
            color: 'bg-blue-500',
          });
        });
      }

      // Process resources
      if (resourcesRes.data) {
        resourcesRes.data.forEach((resource) => {
          allActivities.push({
            id: `resource-${resource.id}`,
            type: 'resource',
            action: 'uploaded',
            title: resource.title,
            subtitle: `${resource.course_type} - ${resource.resource_type}`,
            timestamp: resource.created_at,
            icon: DocumentArrowUpIcon,
            color: 'bg-green-500',
          });
        });
      }

      // Process exams
      if (examsRes.data) {
        examsRes.data.forEach((exam) => {
          allActivities.push({
            id: `exam-${exam.id}`,
            type: 'exam',
            action: 'created',
            title: exam.name,
            subtitle: exam.exam_type,
            timestamp: exam.created_at,
            icon: ClipboardDocumentListIcon,
            color: 'bg-purple-500',
          });
        });
      }

      // Process users
      if (usersRes.data) {
        usersRes.data.forEach((user) => {
          allActivities.push({
            id: `user-${user.id}`,
            type: 'user',
            action: user.role === 'admin' ? 'admin_created' : 'registered',
            title: user.name || user.email,
            subtitle: user.role === 'admin' ? 'Admin user' : 'New user',
            timestamp: user.created_at,
            icon: user.role === 'admin' ? UserIcon : UserPlusIcon,
            color: 'bg-orange-500',
          });
        });
      }

      // Sort by timestamp and take most recent 10
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(allActivities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (type, action) => {
    const actions = {
      course: { created: 'Course created', updated: 'Course updated' },
      resource: { uploaded: 'Resource uploaded', deleted: 'Resource deleted' },
      exam: { created: 'Exam created', updated: 'Exam updated' },
      user: { registered: 'User registered', admin_created: 'Admin created' },
    };
    return actions[type]?.[action] || 'Activity';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div
            key={activity.id}
            className="flex items-start space-x-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className={`${activity.color} rounded-md p-1.5 flex-shrink-0`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {getActionText(activity.type, activity.action)}
              </p>
              <p className="text-xs text-gray-600 truncate">{activity.title}</p>
              {activity.subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{activity.subtitle}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivity;


import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowUpIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResources();
  }, [filterCourse]);

  const fetchResources = async () => {
    try {
      let query = supabase
        .from('course_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterCourse) {
        query = query.eq('course_type', filterCourse);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;

    try {
      if (resource.resource_type === 'PDF' && resource.resource_url) {
        try {
          const urlParts = resource.resource_url.split('/pdf-resources/');
          if (urlParts.length > 1) {
            await supabase.storage.from('pdf-resources').remove([urlParts[1]]);
          }
        } catch (storageError) {
          console.warn('Storage delete failed:', storageError);
        }
      }

      const { error } = await supabase
        .from('course_resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const courses = [
    'Frontend Development',
    'Backend Development',
    'Cybersecurity',
    'Data Science',
    'UI/UX Design',
    'Artificial Intelligence',
    'Machine Learning',
  ];

  const filteredResources = resources.filter((resource) =>
    resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.course_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Resources Management</h1>
            <p className="text-green-100 text-sm mt-1">Manage PDFs, videos, and course materials</p>
          </div>
          <DocumentArrowUpIcon className="h-6 w-6 text-green-300 opacity-50 hidden md:block" />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="pl-8 pr-7 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Button */}
          <Link
            to="/admin/resources/upload"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-md shadow-sm hover:shadow-md hover:from-green-700 hover:to-green-800 transition-all duration-200 whitespace-nowrap"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Upload
          </Link>
        </div>
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
          <DocumentArrowUpIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || filterCourse ? 'No resources found' : 'No resources yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterCourse
              ? 'Try adjusting your search or filter'
              : 'Get started by uploading your first resource'}
          </p>
          {!searchQuery && !filterCourse && (
            <Link
              to="/admin/resources/upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload Your First Resource
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Resource Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div
                      className={`rounded-md p-1.5 ${
                        resource.resource_type === 'PDF'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {resource.resource_type === 'PDF' ? (
                        <DocumentTextIcon className="h-4 w-4" />
                      ) : (
                        <VideoCameraIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{resource.title}</h3>
                      <p className="text-xs text-gray-600 truncate">{resource.course_type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <a
                      href={resource.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View resource"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </a>
                    <Link
                      to={`/admin/resources/edit/${resource.id}`}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Edit resource"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(resource)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete resource"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Resource Content */}
              <div className="p-4">
                {resource.description && (
                  <p className="text-xs text-gray-700 mb-3 line-clamp-2">{resource.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {resource.course_type}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      resource.resource_type === 'PDF'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {resource.resource_type}
                  </span>
                  {resource.duration && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {resource.duration}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                  Uploaded {new Date(resource.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminResources;

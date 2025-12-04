import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';

const ModuleManager = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_published: true
  });

  useEffect(() => {
    fetchCourseAndModules();
  }, [courseId]);

  const fetchCourseAndModules = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*, lessons(count)')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;
      setModules(modulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading modules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingModule) {
        // Update existing module
        const { error } = await supabase
          .from('modules')
          .update({
            title: formData.title,
            description: formData.description,
            is_published: formData.is_published,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingModule.id);

        if (error) throw error;
        alert('Module updated successfully!');
      } else {
        // Create new module
        const nextOrderIndex = modules.length > 0 
          ? Math.max(...modules.map(m => m.order_index)) + 1 
          : 1;

        const { error } = await supabase
          .from('modules')
          .insert({
            course_id: courseId,
            title: formData.title,
            description: formData.description,
            order_index: nextOrderIndex,
            is_published: formData.is_published
          });

        if (error) throw error;
        alert('Module created successfully!');
      }

      setShowForm(false);
      setEditingModule(null);
      setFormData({ title: '', description: '', is_published: true });
      fetchCourseAndModules();
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Error saving module: ' + error.message);
    }
  };

  const handleEdit = (module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || '',
      is_published: module.is_published
    });
    setShowForm(true);
  };

  const handleDelete = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module? This will also delete all lessons in this module.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      alert('Module deleted successfully!');
      fetchCourseAndModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Error deleting module: ' + error.message);
    }
  };

  const handleReorder = async (moduleId, direction) => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (
      (direction === 'up' && moduleIndex === 0) ||
      (direction === 'down' && moduleIndex === modules.length - 1)
    ) {
      return;
    }

    const newModules = [...modules];
    const targetIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;
    
    // Swap
    [newModules[moduleIndex], newModules[targetIndex]] = [newModules[targetIndex], newModules[moduleIndex]];

    // Update order_index
    try {
      const updates = newModules.map((module, index) => 
        supabase
          .from('modules')
          .update({ order_index: index + 1 })
          .eq('id', module.id)
      );

      await Promise.all(updates);
      fetchCourseAndModules();
    } catch (error) {
      console.error('Error reordering modules:', error);
      alert('Error reordering modules');
    }
  };

  const togglePublish = async (module) => {
    try {
      const { error } = await supabase
        .from('modules')
        .update({ is_published: !module.is_published })
        .eq('id', module.id);

      if (error) throw error;
      fetchCourseAndModules();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Error updating module status');
    }
  };

  const handleManageLessons = (moduleId) => {
    navigate(`/admin/modules/${moduleId}/lessons`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Courses
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Modules</h1>
            <p className="text-gray-600 mt-1">
              {course?.title || 'Course'} - {modules.length} module{modules.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingModule(null);
              setFormData({ title: '', description: '', is_published: true });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Module
          </button>
        </div>
      </div>

      {/* Module Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to HTML"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of what this module covers"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Published (visible to students)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingModule ? 'Update Module' : 'Create Module'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingModule(null);
                  setFormData({ title: '', description: '', is_published: true });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No modules yet. Create your first module to get started!</p>
          </div>
        ) : (
          modules.map((module, index) => (
            <div
              key={module.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-500">#{module.order_index}</span>
                    <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
                    {!module.is_published && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  {module.description && (
                    <p className="text-gray-600 mb-3">{module.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {module.lessons?.[0]?.count || 0} lesson{module.lessons?.[0]?.count !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {/* Reorder buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReorder(module.id, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded ${
                        index === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Move up"
                    >
                      <ChevronUpIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleReorder(module.id, 'down')}
                      disabled={index === modules.length - 1}
                      className={`p-1 rounded ${
                        index === modules.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Move down"
                    >
                      <ChevronDownIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManageLessons(module.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Manage Lessons
                    </button>
                    <button
                      onClick={() => togglePublish(module)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                      title={module.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {module.is_published ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(module)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(module.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModuleManager;

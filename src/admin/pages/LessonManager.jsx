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
  EyeSlashIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../utils/supabase';

const LessonManager = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    lesson_type: 'video',
    content_url: '',
    content_text: '',
    thumbnail_url: '',
    duration: '',
    is_published: true,
    is_required: true
  });

  useEffect(() => {
    fetchModuleAndLessons();
  }, [moduleId]);

  const fetchModuleAndLessons = async () => {
    try {
      setLoading(true);
      
      // Fetch module details
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*, courses(*)')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);
      setCourse(moduleData.courses);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingLesson) {
        // Update existing lesson
        const { error } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description,
            lesson_type: formData.lesson_type,
            content_url: formData.content_url || null,
            content_text: formData.content_text || null,
            thumbnail_url: formData.thumbnail_url || null,
            duration: formData.duration || null,
            is_published: formData.is_published,
            is_required: formData.is_required,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        alert('Lesson updated successfully!');
      } else {
        // Create new lesson
        const nextOrderIndex = lessons.length > 0 
          ? Math.max(...lessons.map(l => l.order_index)) + 1 
          : 1;

        const { error } = await supabase
          .from('lessons')
          .insert({
            module_id: moduleId,
            title: formData.title,
            description: formData.description,
            lesson_type: formData.lesson_type,
            content_url: formData.content_url || null,
            content_text: formData.content_text || null,
            thumbnail_url: formData.thumbnail_url || null,
            duration: formData.duration || null,
            order_index: nextOrderIndex,
            is_published: formData.is_published,
            is_required: formData.is_required
          });

        if (error) throw error;
        alert('Lesson created successfully!');
      }

      resetForm();
      fetchModuleAndLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Error saving lesson: ' + error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      lesson_type: 'video',
      content_url: '',
      content_text: '',
      thumbnail_url: '',
      duration: '',
      is_published: true,
      is_required: true
    });
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      lesson_type: lesson.lesson_type,
      content_url: lesson.content_url || '',
      content_text: lesson.content_text || '',
      thumbnail_url: lesson.thumbnail_url || '',
      duration: lesson.duration || '',
      is_published: lesson.is_published,
      is_required: lesson.is_required
    });
    setShowForm(true);
  };

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      alert('Lesson deleted successfully!');
      fetchModuleAndLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Error deleting lesson: ' + error.message);
    }
  };

  const handleReorder = async (lessonId, direction) => {
    const lessonIndex = lessons.findIndex(l => l.id === lessonId);
    if (
      (direction === 'up' && lessonIndex === 0) ||
      (direction === 'down' && lessonIndex === lessons.length - 1)
    ) {
      return;
    }

    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    
    // Swap
    [newLessons[lessonIndex], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[lessonIndex]];

    // Update order_index
    try {
      const updates = newLessons.map((lesson, index) => 
        supabase
          .from('lessons')
          .update({ order_index: index + 1 })
          .eq('id', lesson.id)
      );

      await Promise.all(updates);
      fetchModuleAndLessons();
    } catch (error) {
      console.error('Error reordering lessons:', error);
      alert('Error reordering lessons');
    }
  };

  const togglePublish = async (lesson) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id);

      if (error) throw error;
      fetchModuleAndLessons();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert('Error updating lesson status');
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return PlayCircleIcon;
      case 'pdf':
        return DocumentTextIcon;
      case 'text':
        return DocumentIcon;
      default:
        return DocumentIcon;
    }
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
          onClick={() => navigate(`/admin/courses/${course?.id}/modules`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Modules
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Lessons</h1>
            <p className="text-gray-600 mt-1">
              {module?.title} - {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-gray-500 mt-1">Course: {course?.title}</p>
          </div>
          <button
            onClick={() => {
              setEditingLesson(null);
              setFormData({
                title: '',
                description: '',
                lesson_type: 'video',
                content_url: '',
                content_text: '',
                thumbnail_url: '',
                duration: '',
                is_published: true,
                is_required: true
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Lesson
          </button>
        </div>
      </div>

      {/* Lesson Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Introduction to HTML Tags"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the lesson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Type *
                </label>
                <select
                  value={formData.lesson_type}
                  onChange={(e) => setFormData({ ...formData, lesson_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="video">Video</option>
                  <option value="pdf">PDF Document</option>
                  <option value="text">Text/Article</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (e.g., 15 min, 1 hour)
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15 min"
                />
              </div>

              {formData.lesson_type !== 'text' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content URL * {formData.lesson_type === 'video' ? '(YouTube or direct video link)' : '(PDF URL)'}
                  </label>
                  <input
                    type="url"
                    required={formData.lesson_type !== 'text'}
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              )}

              {formData.lesson_type === 'text' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Text *
                  </label>
                  <textarea
                    required={formData.lesson_type === 'text'}
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="You can use HTML markup here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports HTML markup</p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                    Published
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_required"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_required" className="text-sm font-medium text-gray-700">
                    Required
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500 text-lg">No lessons yet. Create your first lesson to get started!</p>
          </div>
        ) : (
          lessons.map((lesson, index) => {
            const LessonIcon = getLessonIcon(lesson.lesson_type);
            
            return (
              <div
                key={lesson.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-gray-500">#{lesson.order_index}</span>
                      <LessonIcon className="h-6 w-6 text-gray-400" />
                      <h3 className="text-xl font-semibold text-gray-900">{lesson.title}</h3>
                      {!lesson.is_published && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                          Draft
                        </span>
                      )}
                      {lesson.is_required && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-gray-600 mb-2">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{lesson.lesson_type}</span>
                      {lesson.duration && <span>• {lesson.duration}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {/* Reorder buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReorder(lesson.id, 'up')}
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
                        onClick={() => handleReorder(lesson.id, 'down')}
                        disabled={index === lessons.length - 1}
                        className={`p-1 rounded ${
                          index === lessons.length - 1
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
                        onClick={() => togglePublish(lesson)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title={lesson.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {lesson.is_published ? (
                          <EyeIcon className="h-5 w-5" />
                        ) : (
                          <EyeSlashIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(lesson)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(lesson.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LessonManager;

import { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { AuthContext } from '../../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  HomeIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const AdminCourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [duration, setDuration] = useState('');
  const [tags, setTags] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchCourseForEdit();
    }
  }, [id]);

  const fetchCourseForEdit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setImageUrl(data.image_url || '');
        setLink(data.link || '');
        setDuration(data.duration || '');
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '');
        setLearningOutcomes(
          Array.isArray(data.learning_outcomes)
            ? data.learning_outcomes.join(', ')
            : data.learning_outcomes || ''
        );
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    setSaving(true);
    try {
      // Parse tags and learning outcomes
      const tagsArray = tags
        ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [];
      const outcomesArray = learningOutcomes
        ? learningOutcomes.split(',').map((outcome) => outcome.trim()).filter((outcome) => outcome)
        : [];

      const courseData = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        link: link.trim() || null,
        duration: duration.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        learning_outcomes: outcomesArray.length > 0 ? outcomesArray : null,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Course updated successfully!');
        navigate('/admin/courses');
      } else {
        const { error } = await supabase.from('courses').insert([courseData]);

        if (error) throw error;
        toast.success('Course created successfully!');
        navigate('/admin/courses');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error((isEditMode ? 'Update' : 'Create') + ' failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center text-blue-100 hover:text-white text-sm transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
              <span className="text-blue-200">•</span>
              <Link
                to="/admin/courses"
                className="inline-flex items-center text-blue-100 hover:text-white text-sm transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Courses
              </Link>
            </div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Course' : 'Create Course'}</h1>
            <p className="text-blue-100 text-sm mt-1">
              {isEditMode ? 'Update course details' : 'Add a new course to your platform'}
            </p>
          </div>
          <BookOpenIcon className="h-6 w-6 text-blue-300 opacity-50 hidden md:block" />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Frontend Development"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Course description..."
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL</label>
            <div className="relative">
              <PhotoIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-32 w-full object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course Link</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., /course/frontendcourse"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 8 weeks, 40 hours"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comma-separated tags (e.g., React, JavaScript, HTML)"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
          </div>

          {/* Learning Outcomes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Learning Outcomes</label>
            <textarea
              value={learningOutcomes}
              onChange={(e) => setLearningOutcomes(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Comma-separated learning outcomes"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple outcomes with commas</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold py-2.5 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <BookOpenIcon className="h-4 w-4 mr-1.5" />
                  {isEditMode ? 'Update Course' : 'Create Course'}
                </>
              )}
            </button>
            <Link
              to="/admin/courses"
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default AdminCourseForm;







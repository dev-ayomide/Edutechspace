
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
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminCourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditMode = !!id;

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [duration, setDuration] = useState('');
  const [tags, setTags] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState(''); // Kept for backward compatibility if needed, or mapped to what_you_will_learn

  // New Dynamic Content Fields
  const [overviewFull, setOverviewFull] = useState('');
  const [keyBenefits, setKeyBenefits] = useState(['']);
  const [whatYouWillLearn, setWhatYouWillLearn] = useState(['']);
  const [requirements, setRequirements] = useState(['']);

  // Metadata
  const [difficultyLevel, setDifficultyLevel] = useState('Beginner Level');
  const [scheduleType, setScheduleType] = useState('Flexible Schedule');
  const [rating, setRating] = useState(0);
  const [studentsApplied, setStudentsApplied] = useState(0);

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
        setHeaderImageUrl(data.header_image_url || '');
        setLink(data.link || '');
        setDuration(data.duration || '');
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '');

        // Handle new fields
        setOverviewFull(data.overview_full || data.description || ''); // Fallback to description if overview empty
        setDifficultyLevel(data.difficulty_level || 'Beginner Level');
        setScheduleType(data.schedule_type || 'Flexible Schedule');
        setRating(data.rating || 0);
        setStudentsApplied(data.students_applied_count || 0);

        // Handle JSONB Arrays
        setKeyBenefits(Array.isArray(data.key_benefits) && data.key_benefits.length > 0 ? data.key_benefits : ['']);

        // what_you_will_learn might be stored in 'learning_outcomes' (text[]) or 'what_you_will_learn' (jsonb)
        // prioritizing jsonb, falling back to legacy text array
        const outcomesList = Array.isArray(data.what_you_will_learn) && data.what_you_will_learn.length > 0
          ? data.what_you_will_learn
          : (Array.isArray(data.learning_outcomes) ? data.learning_outcomes : ['']);
        setWhatYouWillLearn(outcomesList);

        // requirements
        setRequirements(Array.isArray(data.requirements) && data.requirements.length > 0 ? data.requirements : ['']);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (index, value, setter, currentArray) => {
    const newArray = [...currentArray];
    newArray[index] = value;
    setter(newArray);
  };

  const addArrayItem = (setter, currentArray) => {
    setter([...currentArray, '']);
  };

  const removeArrayItem = (index, setter, currentArray) => {
    const newArray = currentArray.filter((_, i) => i !== index);
    setter(newArray.length ? newArray : ['']); // Keep at least one empty input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a course title');
      return;
    }

    setSaving(true);
    try {
      // Clean up arrays: remove empty strings
      const cleanKeyBenefits = keyBenefits.map(i => i.trim()).filter(i => i);
      const cleanWhatYouWillLearn = whatYouWillLearn.map(i => i.trim()).filter(i => i);
      const cleanRequirements = requirements.map(i => i.trim()).filter(i => i);

      // Legacy tags handling
      const tagsArray = tags
        ? tags.split(',').map((tag) => tag.trim()).filter((tag) => tag)
        : [];

      const courseData = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        header_image_url: headerImageUrl.trim() || null,
        link: link.trim() || null,
        duration: duration.trim() || null,
        tags: tagsArray.length > 0 ? tagsArray : null,

        // New Columns
        overview_full: overviewFull.trim() || description.trim() || null,
        difficulty_level: difficultyLevel,
        schedule_type: scheduleType,
        rating: parseFloat(rating),
        students_applied_count: parseInt(studentsApplied),

        // JSONB Columns
        key_benefits: cleanKeyBenefits,
        what_you_will_learn: cleanWhatYouWillLearn,
        requirements: cleanRequirements,

        // Sync legacy column just in case
        learning_outcomes: cleanWhatYouWillLearn
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Course updated successfully!');
        // Optional: stay on page to keep editing
        // navigate('/admin/courses'); 
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

  const DynamicListInput = ({ title, items, setter }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <label className="block text-sm font-semibold text-gray-700 mb-2">{title}</label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayChange(index, e.target.value, setter, items)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Add ${title.toLowerCase()}...`}
            />
            <button
              type="button"
              onClick={() => removeArrayItem(index, setter, items)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Remove item"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem(setter, items)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Item
        </button>
      </div>
    </div>
  );

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md px-6 py-4 text-white sticky top-0 z-10">
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
          </div>
          {/* Quick Actions / Save Button at top for easy access */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Form Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Frontend Development"
                  required
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description (Card)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary shown on course cards..."
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail Image URL (Card)</label>
                <div className="relative">
                  <PhotoIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Header/Hero Image URL (Page)</label>
                <div className="relative">
                  <PhotoIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={headerImageUrl}
                    onChange={(e) => setHeaderImageUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slug / Link</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., /course/frontendcourse"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="React, JS, HTML"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Course Details & Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Course Details & Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option>Beginner Level</option>
                  <option>Intermediate Level</option>
                  <option>Advanced Level</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Schedule</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option>Flexible Schedule</option>
                  <option>Fixed Schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rating (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Students Applied</label>
                <input
                  type="number"
                  value={studentsApplied}
                  onChange={(e) => setStudentsApplied(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Course Overview (Detailed)</label>
                <textarea
                  value={overviewFull}
                  onChange={(e) => setOverviewFull(e.target.value)}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed overview shown on the course page..."
                />
              </div>

            </div>
          </div>

          {/* Section 3: Dynamic Content (Lists) */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Curriculum & Requirements</h3>
            <div className="grid grid-cols-1 gap-6">
              <DynamicListInput
                title="Key Benefits"
                items={keyBenefits}
                setter={setKeyBenefits}
              />
              <DynamicListInput
                title="What You Will Learn"
                items={whatYouWillLearn}
                setter={setWhatYouWillLearn}
              />
              <DynamicListInput
                title="Requirements / Prerequisites"
                items={requirements}
                setter={setRequirements}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {saving ? 'Saving Changes...' : (isEditMode ? 'Update Course Details' : 'Create New Course')}
            </button>
            <Link
              to="/admin/courses"
              className="px-6 py-3 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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




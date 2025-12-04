import { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { AuthContext } from '../../context/AuthProvider';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  ArrowLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const ResourceUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditMode = !!id;
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [courseType, setCourseType] = useState('');
  const [resourceType, setResourceType] = useState('PDF');
  const [resourceUrl, setResourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [uploadedResources, setUploadedResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const courses = [
    'Frontend Development',
    'Backend Development',
    'Cybersecurity',
    'Data Science',
    'UI/UX Design',
    'Artificial Intelligence',
    'Machine Learning',
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchResourceForEdit();
    }
    fetchResources();
  }, [courseType, id]);

  const fetchResourceForEdit = async () => {
    try {
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCourseType(data.course_type || '');
        setResourceType(data.resource_type || 'PDF');
        setResourceUrl(data.resource_url || '');
        setDuration(data.duration || '');
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      toast.error('Failed to load resource');
      navigate('/admin/resources');
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('course_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (courseType) {
        query = query.eq('course_type', courseType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUploadedResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!courseType) {
      toast.error('Please select a course type');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (resourceType === 'PDF' && !file && !isEditMode) {
      toast.error('Please select a PDF file');
      return;
    }
    if (resourceType === 'Video' && !resourceUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = resourceUrl;
      let thumbnailUrl = null;

      // Only upload new file if one is selected
      if (resourceType === 'PDF' && file) {
        const fileExt = file.name.split('.').pop();
        if (fileExt.toLowerCase() !== 'pdf') {
          toast.error('Only PDF files are allowed');
          setUploading(false);
          return;
        }

        const filePath = `${courseType.replace(/\s+/g, '_')}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('pdf-resources')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pdf-resources')
          .getPublicUrl(filePath);

        finalUrl = urlData.publicUrl;
      }

      if (thumbnailFile) {
        const thumbnailExt = thumbnailFile.name.split('.').pop();
        const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
        if (!allowedExts.includes(thumbnailExt.toLowerCase())) {
          toast.error('Thumbnail must be an image (jpg, png, webp)');
          setUploading(false);
          return;
        }

        const thumbnailPath = `thumbnails/${courseType.replace(/\s+/g, '_')}/${Date.now()}-${thumbnailFile.name}`;
        const { error: thumbnailError } = await supabase.storage
          .from('pdf-resources')
          .upload(thumbnailPath, thumbnailFile);

        if (thumbnailError) {
          console.warn('Thumbnail upload failed:', thumbnailError);
        } else {
          const { data: thumbnailUrlData } = supabase.storage
            .from('pdf-resources')
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbnailUrlData.publicUrl;
        }
      }

      let processedUrl = finalUrl;
      if (resourceType === 'Video' && finalUrl) {
        if (finalUrl.includes('youtube.com/watch?v=') || finalUrl.includes('youtu.be/')) {
          processedUrl = finalUrl;
        }
      }

      const resourceData = {
        title: title.trim(),
        description: description.trim() || null,
        course_type: courseType,
        resource_type: resourceType,
        resource_url: processedUrl,
        duration: duration.trim() || null,
      };

      if (thumbnailUrl) {
        resourceData.thumbnail_url = thumbnailUrl;
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('course_resources')
          .update(resourceData)
          .eq('id', id);

        if (updateError) throw updateError;
        toast.success('Resource updated successfully!');
        navigate('/admin/resources');
      } else {
        const { error: insertError } = await supabase.from('course_resources').insert([
          {
            ...resourceData,
            uploaded_by: user.email,
            created_by: user.id,
          },
        ]);

        if (insertError) throw insertError;
        toast.success('Resource uploaded successfully!');
        setTitle('');
        setDescription('');
        setResourceUrl('');
        setDuration('');
        setFile(null);
        setThumbnailFile(null);
        fetchResources();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error((isEditMode ? 'Update' : 'Upload') + ' failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;

    setLoading(true);
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

      const { error } = await supabase.from('course_resources').delete().eq('id', resource.id);

      if (error) throw error;
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-md px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center text-green-100 hover:text-white text-sm transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
              <span className="text-green-200">•</span>
              <Link
                to="/admin/resources"
                className="inline-flex items-center text-green-100 hover:text-white text-sm transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Resources
              </Link>
            </div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Resource' : 'Upload Resource'}</h1>
            <p className="text-green-100 text-sm mt-1">
              {isEditMode ? 'Update resource details' : 'Add PDF files or video links to your courses'}
            </p>
          </div>
          <CloudArrowUpIcon className="h-6 w-6 text-green-300 opacity-50 hidden md:block" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Resource Details</h2>

            <div className="space-y-4">
              {/* Course Type & Resource Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Course Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Resource Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={resourceType}
                    onChange={(e) => {
                      setResourceType(e.target.value);
                      if (e.target.value === 'Video') setFile(null);
                      else setResourceUrl('');
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Video">Video Link</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter resource title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional description of the resource"
                />
              </div>

              {/* PDF Upload Section */}
              {resourceType === 'PDF' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PDF File <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF up to 10MB</p>
                      </div>
                    </div>
                    {file && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thumbnail Image <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                            <span>Upload thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">JPG, PNG, or WebP (800x450px recommended)</p>
                      </div>
                    </div>
                    {thumbnailFile && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-medium text-gray-900">{thumbnailFile.name}</p>
                        </div>
                        <button
                          onClick={() => setThumbnailFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Video URL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <VideoCameraIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="url"
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://youtube.com/watch?v=... or direct video URL"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Supports YouTube URLs (will be converted to embed) or direct video links
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 10:25 or 1h 30m"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thumbnail Image <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                            <span>Upload thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                              className="sr-only"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">JPG, PNG, or WebP (800x450px recommended)</p>
                      </div>
                    </div>
                    {thumbnailFile && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <PhotoIcon className="h-8 w-8 text-green-600" />
                          <p className="text-sm font-medium text-gray-900">{thumbnailFile.name}</p>
                        </div>
                        <button
                          onClick={() => setThumbnailFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold py-2.5 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditMode ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                    {isEditMode ? 'Update Resource' : 'Upload Resource'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Resources List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">
                {courseType ? `${courseType}` : 'All Resources'}
              </h3>
              {courseType && (
                <button
                  onClick={() => setCourseType('')}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : uploadedResources.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No resources found</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {uploadedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                        {resource.title}
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {resource.course_type}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        {resource.resource_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={resource.resource_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(resource)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ResourceUpload;

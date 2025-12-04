import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam? This will also delete all questions.')) return;

    try {
      await supabase.from('exam_questions').delete().eq('exam_id', id);
      await supabase.from('exam_results').delete().eq('exam_id', id);
      const { error } = await supabase.from('exams').delete().eq('id', id);

      if (error) throw error;
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('Failed to delete exam');
    }
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.exam_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-md px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exams Management</h1>
            <p className="text-purple-100 text-sm mt-1">Manage certification exams and assessments</p>
          </div>
          <ClipboardDocumentListIcon className="h-6 w-6 text-purple-300 opacity-50 hidden md:block" />
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Add Button */}
          <Link
            to="/admin/exams/create"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-md shadow-sm hover:shadow-md hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Create Exam
          </Link>
        </div>
      </div>

      {/* Exams List */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No exams found' : 'No exams yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first exam'}
          </p>
          {!searchQuery && (
            <Link
              to="/admin/exams/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Exam
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Exam Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                <div className="flex items-start justify-between mb-3">
                  <ClipboardDocumentListIcon className="h-6 w-6 opacity-80" />
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold backdrop-blur-sm">
                    {exam.exam_type}
                  </span>
                </div>
                <h3 className="text-base font-bold line-clamp-2">{exam.name}</h3>
              </div>

              {/* Exam Content */}
              <div className="p-4">
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1.5 text-purple-600" />
                      <span className="text-xs font-medium">Duration</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{exam.duration_minutes} min</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 mr-1.5 text-green-600" />
                      <span className="text-xs font-medium">Passing Score</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{exam.passing_score}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(exam.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1.5">
                    <Link
                      to={`/admin/exams/view/${exam.id}`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View exam"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/admin/exams/edit/${exam.id}`}
                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                      title="Edit exam"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete exam"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminExams;

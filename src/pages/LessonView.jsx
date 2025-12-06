import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import SidePanel, { SidePanelToggle } from '../component/modules/SidePanel';
import { useLesson, useAllCourseLessons, useModules } from '../utils/useModules';
import { useLessonCompletion, useMultipleLessonCompletions } from '../utils/useLessonCompletion';
import { isYouTubeUrl, convertYouTubeUrl, renderVideoPlayer } from '../utils/videoUtils';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const { lesson, module, loading: lessonLoading, error: lessonError } = useLesson(lessonId);
  const { modules, loading: modulesLoading } = useModules(courseId);
  const { allLessons } = useAllCourseLessons(courseId);
  const { isCompleted, markComplete, markIncomplete, loading: completionLoading } = useLessonCompletion(lessonId);

  // Get completion status for all lessons
  const lessonIds = allLessons.map(l => l.id);
  const { completions } = useMultipleLessonCompletions(lessonIds);

  // Find current lesson index
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleToggleCompletion = async () => {
    if (isCompleted) {
      await markIncomplete();
    } else {
      await markComplete();
    }
  };

  const handlePrevious = () => {
    if (previousLesson) {
      navigate(`/course/${courseId}/lesson/${previousLesson.id}`);
    }
  };

  const handleNext = () => {
    if (nextLesson) {
      // Auto-mark current lesson as complete when going to next
      if (!isCompleted) {
        markComplete();
      }
      navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const handleBackToCourse = () => {
    navigate('/course');
  };

  if (lessonLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-600 mb-4">The lesson you're looking for doesn't exist.</p>
          <button
            onClick={handleBackToCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const renderLessonContent = () => {
    switch (lesson.lesson_type) {
      case 'video':
        if (!lesson.content_url) {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No video URL provided</p>
            </div>
          );
        }

        if (isYouTubeUrl(lesson.content_url)) {
          return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={convertYouTubeUrl(lesson.content_url)}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } else {
          return (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {renderVideoPlayer(lesson.content_url, lesson.title)}
            </div>
          );
        }

      case 'pdf':
        if (!lesson.content_url) {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No PDF URL provided</p>
            </div>
          );
        }
        return (
          <div className="w-full h-[600px] lg:h-[700px] bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              src={lesson.content_url}
              title={lesson.title}
              className="w-full h-full"
            />
          </div>
        );

      case 'text':
        return (
          <div className="prose max-w-none bg-white rounded-lg p-6 lg:p-8">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text || 'No content available' }} />
          </div>
        );

      default:
        return (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Unsupported lesson type</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navigation bar */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBackToCourse}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Course</span>
              </button>

              <div className="flex-1 mx-4 min-w-0">
                <h1 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                  {lesson.title}
                </h1>
                {module && (
                  <p className="text-xs text-gray-500 truncate">
                    {module.title}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
                className="lg:hidden px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Content
              </button>
            </div>
          </div>
        </div>

        {/* Lesson content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Lesson player/viewer */}
            <div className="mb-6">
              {renderLessonContent()}
            </div>

            {/* Lesson details */}
            <div className="bg-white rounded-lg shadow-sm p-6 lg:p-8 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {lesson.title}
                  </h2>
                  {lesson.duration && (
                    <p className="text-sm text-gray-500 mb-4">
                      Duration: {lesson.duration}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleToggleCompletion}
                  disabled={completionLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isCompleted
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              {lesson.description && (
                <div className="prose max-w-none text-gray-600">
                  <p>{lesson.description}</p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 mb-8">
              <button
                onClick={handlePrevious}
                disabled={!previousLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${previousLesson
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <div className="text-center text-sm text-gray-500">
                Lesson {currentIndex + 1} of {allLessons.length}
              </div>

              <button
                onClick={handleNext}
                disabled={!nextLesson}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${nextLesson
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <span className="hidden sm:inline">Next</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Next lesson preview */}
            {nextLesson && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                <p className="text-sm text-gray-500 mb-2">Up Next</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {nextLesson.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {nextLesson.module_title}
                </p>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <PlayIcon className="h-5 w-5" />
                  Continue Learning
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <SidePanel
        modules={modules}
        currentLessonId={lessonId}
        courseId={courseId}
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        completions={completions}
      />

      {/* Mobile toggle button */}
      <SidePanelToggle
        onClick={() => setSidePanelOpen(!sidePanelOpen)}
        isOpen={sidePanelOpen}
      />
    </div>
  );
};

export default LessonView;

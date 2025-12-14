import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import SidePanel, { SidePanelToggle } from '../component/modules/SidePanel';
import { useLesson, useAllCourseLessons, useModules } from '../utils/useModules';
import { useLessonCompletion, useMultipleLessonCompletions } from '../utils/useLessonCompletion';
import { isYouTubeUrl, convertYouTubeUrl, renderVideoPlayer } from '../utils/videoUtils';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lesson not found</h2>
          <p className="text-gray-600 mb-6">The lesson you're looking for doesn't exist.</p>
          <button
            onClick={handleBackToCourse}
            className="btn-udemy"
          >
            Back to courses
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
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <p className="text-gray-400">No video available</p>
            </div>
          );
        }

        if (isYouTubeUrl(lesson.content_url)) {
          return (
            <div className="aspect-video bg-black">
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
            <div className="aspect-video bg-black">
              {renderVideoPlayer(lesson.content_url, lesson.title)}
            </div>
          );
        }

      case 'pdf':
        if (!lesson.content_url) {
          return (
            <div className="h-[600px] bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">No PDF available</p>
            </div>
          );
        }
        return (
          <div className="w-full h-[600px] lg:h-[700px] bg-gray-100">
            <iframe
              src={lesson.content_url}
              title={lesson.title}
              className="w-full h-full"
            />
          </div>
        );

      case 'text':
        return (
          <div className="prose max-w-none p-6 lg:p-8 bg-white">
            <div dangerouslySetInnerHTML={{ __html: lesson.content_text || 'No content available' }} />
          </div>
        );

      default:
        return (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">Unsupported content type</p>
          </div>
        );
    }
  };

  // Calculate progress
  const completedCount = Object.values(completions).filter(Boolean).length;
  const progress = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top navigation bar - Dark like Udemy */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToCourse}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>

          {/* Course title - first after back button */}
          <span className="text-white text-lg font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] capitalize">
            {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress bar - before course content */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-gray-400 text-sm">{progress}% complete</span>
          </div>

          {/* Course content toggle */}
          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            Course content
            <Bars3Icon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video/Content area */}
        <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${sidePanelOpen ? '' : ''}`}>
          {/* Video player - Full width dark background */}
          <div className="bg-black flex-shrink-0">
            {renderLessonContent()}
          </div>

          {/* Lesson details - White background */}
          <div className="bg-white flex-1">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Navigation & completion */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={!previousLesson}
                    className={`p-2 border ${previousLesson ? 'border-gray-900 hover:bg-gray-100' : 'border-gray-300 text-gray-300 cursor-not-allowed'}`}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!nextLesson}
                    className={`p-2 border ${nextLesson ? 'border-gray-900 hover:bg-gray-100' : 'border-gray-300 text-gray-300 cursor-not-allowed'}`}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 ml-2">
                    {currentIndex + 1} / {allLessons.length}
                  </span>
                </div>

                <button
                  onClick={handleToggleCompletion}
                  disabled={completionLoading}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${isCompleted
                    ? 'text-gray-600 hover:text-gray-800'
                    : 'text-gray-900 border border-gray-900 hover:bg-gray-100'
                    }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircleSolidIcon className="h-5 w-5 text-blue-600" />
                      Completed
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Mark as complete
                    </>
                  )}
                </button>
              </div>

              {/* Lesson info */}
              <div>
                {module && (
                  <p className="text-sm text-gray-500 mb-2">{module.title}</p>
                )}
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {lesson.title}
                </h1>

                {lesson.description && (
                  <p className="text-gray-600">{lesson.description}</p>
                )}

                {lesson.duration && (
                  <p className="text-sm text-gray-500 mt-4">
                    Duration: {lesson.duration}
                  </p>
                )}
              </div>

              {/* Next lesson preview */}
              {nextLesson && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-2">Up next</p>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <div className="w-10 h-10 bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <PlayIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{nextLesson.title}</p>
                      {nextLesson.duration && (
                        <p className="text-sm text-gray-500">{nextLesson.duration}</p>
                      )}
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400" />
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
      </div>

      {/* Mobile toggle button */}
      <SidePanelToggle
        onClick={() => setSidePanelOpen(!sidePanelOpen)}
        isOpen={sidePanelOpen}
      />
    </div>
  );
};

export default LessonView;

import React, { useState } from 'react';
import { XMarkIcon, Bars3Icon, CheckCircleIcon, PlayCircleIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const SidePanel = ({ modules, currentLessonId, courseId, isOpen, onClose, completions = {} }) => {
  const navigate = useNavigate();
  const [expandedModules, setExpandedModules] = useState(() => {
    // Auto-expand the module containing the current lesson
    const moduleWithCurrentLesson = modules.find(m => 
      m.lessons?.some(l => l.id === currentLessonId)
    );
    return moduleWithCurrentLesson ? [moduleWithCurrentLesson.id] : [];
  });

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/course/${courseId}/lesson/${lessonId}`);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const getLessonIcon = (lessonType) => {
    switch (lessonType) {
      case 'video':
        return PlayCircleIcon;
      case 'pdf':
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const calculateModuleProgress = (module) => {
    const lessons = module.lessons || [];
    if (lessons.length === 0) return 0;
    
    const completedCount = lessons.filter(l => completions[l.id]).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Side panel */}
      <div
        className={`fixed lg:sticky top-0 right-0 h-screen w-80 bg-white border-l border-gray-200 overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Module list */}
        <div className="p-2">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id);
            const progress = calculateModuleProgress(module);
            const lessonCount = module.lessons?.length || 0;

            return (
              <div key={module.id} className="mb-2">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 mt-0.5">
                    {moduleIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {module.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
                      {progress > 0 && (
                        <span className="text-green-600">• {progress}%</span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    {lessonCount > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div
                          className="bg-green-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  )}
                </button>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="ml-9 mt-1 space-y-1">
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, lessonIndex) => {
                        const LessonIcon = getLessonIcon(lesson.lesson_type);
                        const isCompleted = completions[lesson.id] || false;
                        const isCurrent = lesson.id === currentLessonId;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson.id)}
                            className={`w-full flex items-start gap-2 p-2 rounded-lg transition-colors text-left ${
                              isCurrent 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <LessonIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                              isCurrent ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${
                                isCurrent 
                                  ? 'text-blue-900 font-medium' 
                                  : 'text-gray-700'
                              }`}>
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {lesson.duration}
                                </p>
                              )}
                            </div>
                            {isCompleted && (
                              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-500 px-2 py-3">
                        No lessons available
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Course progress summary */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="text-sm text-gray-700 mb-2">
            Overall Progress
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${modules.reduce((acc, m) => acc + calculateModuleProgress(m), 0) / modules.length || 0}%` 
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// Toggle button component
export const SidePanelToggle = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 lg:hidden z-30 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      aria-label="Toggle course content"
    >
      {isOpen ? (
        <XMarkIcon className="h-6 w-6" />
      ) : (
        <Bars3Icon className="h-6 w-6" />
      )}
    </button>
  );
};

export default SidePanel;

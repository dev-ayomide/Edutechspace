import React, { useState } from 'react';
import { XMarkIcon, Bars3Icon, PlayCircleIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
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
    if (lessons.length === 0) return { completed: 0, total: 0 };

    const completedCount = lessons.filter(l => completions[l.id]).length;
    return { completed: completedCount, total: lessons.length };
  };

  // Calculate overall stats
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const completedLessons = modules.reduce((acc, m) =>
    acc + (m.lessons?.filter(l => completions[l.id]).length || 0), 0
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Side panel */}
      <div className="w-[340px] bg-white border-l border-gray-100 flex flex-col flex-shrink-0 fixed lg:relative right-0 top-0 lg:top-0 h-full lg:h-auto z-40 shadow-xl lg:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Course content</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {completedLessons} / {totalLessons} lectures completed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.includes(module.id);
            const { completed, total } = calculateModuleProgress(module);

            return (
              <div key={module.id} className="border-b border-gray-100">
                {/* Module header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-sm text-gray-800 leading-snug">
                      Section {moduleIndex + 1}: {module.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {completed} / {total} {module.duration ? `• ${module.duration}` : ''}
                    </p>
                  </div>
                  <div className="p-1">
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="bg-white pb-2">
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons.map((lesson, lessonIndex) => {
                        const isCompleted = completions[lesson.id] || false;
                        const isCurrent = lesson.id === currentLessonId;
                        const LessonIcon = getLessonIcon(lesson.lesson_type);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonClick(lesson.id)}
                            className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-all duration-150 ${isCurrent
                                ? 'bg-blue-50/70 border-l-2 border-l-blue-500'
                                : 'hover:bg-gray-50/80 border-l-2 border-l-transparent'
                              }`}
                          >
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isCompleted ? (
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 border-[1.5px] border-gray-300 rounded-sm bg-white" />
                              )}
                            </div>

                            {/* Lesson info */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-snug ${isCurrent
                                  ? 'font-medium text-gray-900'
                                  : isCompleted
                                    ? 'text-gray-500'
                                    : 'text-gray-700'
                                }`}>
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <LessonIcon className="h-3.5 w-3.5 text-gray-400" />
                                {lesson.duration && (
                                  <span className="text-xs text-gray-400">{lesson.duration}</span>
                                )}
                              </div>
                            </div>

                            {/* Current indicator */}
                            {isCurrent && (
                              <div className="flex-shrink-0 mt-1">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-5 py-4 text-sm text-gray-400 italic">
                        No lessons available
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// Toggle button component
export const SidePanelToggle = ({ onClick, isOpen }) => {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 lg:hidden z-30 bg-gray-900 text-white p-4 rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
      aria-label="Toggle course content"
    >
      <Bars3Icon className="h-6 w-6" />
    </button>
  );
};

export default SidePanel;

import React from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckCircleIcon, PlayCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useModuleProgress } from '../../utils/useLessonCompletion';

const ModuleAccordion = ({ module, onLessonClick, completions = {} }) => {
  const { progress, completedLessons, totalLessons } = useModuleProgress(module.id);

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

  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration;
  };

  return (
    <Disclosure as="div" className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between bg-white px-6 py-4 text-left hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
              {module.description && (
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">
                  {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
                </span>
                {progress > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    {completedLessons}/{totalLessons} completed ({progress}%)
                  </span>
                )}
              </div>
              {/* Progress bar */}
              {totalLessons > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180 transform' : ''
              } h-5 w-5 text-gray-500 transition-transform duration-200 ml-4 flex-shrink-0`}
            />
          </Disclosure.Button>

          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <Disclosure.Panel className="bg-gray-50 border-t border-gray-200">
              <div className="divide-y divide-gray-200">
                {module.lessons && module.lessons.length > 0 ? (
                  module.lessons.map((lesson, index) => {
                    const LessonIcon = getLessonIcon(lesson.lesson_type);
                    const isCompleted = completions[lesson.id] || false;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onLessonClick(lesson)}
                        className="w-full flex items-start gap-4 px-6 py-4 hover:bg-white transition-colors text-left group"
                      >
                        {/* Lesson number */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          {index + 1}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <LessonIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {lesson.title}
                            </h4>
                          </div>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{lesson.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {lesson.duration && (
                              <span className="text-xs text-gray-500">
                                {formatDuration(lesson.duration)}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 capitalize">
                              {lesson.lesson_type}
                            </span>
                          </div>
                        </div>

                        {/* Completion status */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircleIcon className="h-6 w-6 text-green-500" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No lessons available in this module yet.
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );
};

export default ModuleAccordion;

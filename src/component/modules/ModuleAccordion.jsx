import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, PlayCircleIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
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

  return (
    <Disclosure as="div" className="border border-gray-200">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full items-center justify-between px-4 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{module.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {completedLessons} / {totalLessons} | {module.duration || ''}
              </p>
            </div>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </Disclosure.Button>

          <Disclosure.Panel>
            {module.lessons && module.lessons.length > 0 ? (
              module.lessons.map((lesson, index) => {
                const LessonIcon = getLessonIcon(lesson.lesson_type);
                const isCompleted = completions[lesson.id] || false;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonClick(lesson)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                  >
                    {/* Checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircleSolidIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-sm" />
                      )}
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        {index + 1}. {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <LessonIcon className="h-4 w-4 text-gray-400" />
                        {lesson.duration && (
                          <span className="text-xs text-gray-500">{lesson.duration}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No lessons available in this module yet.
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default ModuleAccordion;

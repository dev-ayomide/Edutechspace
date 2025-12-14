import React from "react";
import { Link } from "react-router-dom";
import { PlayIcon } from '@heroicons/react/24/solid';

const CourseProgress = ({ progressData }) => {
  // Map course names to route paths (adjust based on your course routes)
  const courseRouteMap = {
    "Frontend Development": "/course/frontendcourse",
    "Cybersecurity": "/course/cybersecuritycourse",
    "Machine Learning": "/course/mlcourse",
    "Backend Development": "/course/backendcourse",
    "Artificial Intelligence": "/course/aicourse",
    "Ui/Ux": "/course/uiuxcourse",
    "Data Science": "/course/datasciencecourse",
  };

  return (
    <div className="bg-white border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">My learning</h3>

      {progressData && progressData.length > 0 ? (
        <div className="space-y-4">
          {progressData.map((course, index) => {
            const progress = course.progress_percentage || 0;
            const isCompleted = course.completed || progress >= 100;

            return (
              <div key={course.id || index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {course.course_name || "Unnamed Course"}
                  </h4>
                  {isCompleted && (
                    <span className="text-xs font-bold text-green-600">
                      COMPLETE
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-200 mb-3">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {progress}% complete
                  </span>
                  <Link
                    to={courseRouteMap[course.course_name] || "/course"}
                    className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                    {isCompleted ? "Review" : "Continue"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-4">Start learning today!</p>
          <Link
            to="/course"
            className="inline-block bg-blue-600 text-white font-bold py-2 px-4 text-sm hover:bg-blue-700 transition-colors"
          >
            Browse courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseProgress;
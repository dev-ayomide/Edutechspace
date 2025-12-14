import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { supabase } from '../utils/supabase';
import { toast } from 'react-toastify';

// Import course images (fallback if image_url not in database)
import cybersecurityImage from '../assets/images/cybersecurityImage.jpg';
import machineLearningImage from '../assets/images/machineLearningImage.jpeg';
import frontendImage from '../assets/images/frontendImage.jpg';
import backendImage from '../assets/images/backendImage.jpg';
import dataScienceImage from '../assets/images/dataScienceImage.png';
import uiuxImage from '../assets/images/uiuxImage.jpg';
import dataAnalysesImage from '../assets/images/dataAnalysesImage.jpg';
import aiImage from '../assets/images/aiImage.jpg';

// Image mapping for fallback (if database doesn't have image_url)
const imageMap = {
  'frontend': frontendImage,
  'cybersecurity': cybersecurityImage,
  'machinelearning': machineLearningImage,
  'datascience': dataScienceImage,
  'backend': backendImage,
  'uiux': uiuxImage,
  'dataanalysis': dataAnalysesImage,
  'ai': aiImage,
};

const courseVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.5,
      ease: 'easeInOut',
      duration: 0.5,
    },
  }),
};

const CourseCard = ({ course, index, isEnrolled, enrollCourse, handleContinueLearning, setHoveredCourse, hoveredCourse }) => {
  return (
    <motion.div
      variants={courseVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <div
        className="relative bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col"
        onMouseEnter={() => setHoveredCourse(course.id)}
        onMouseLeave={() => setHoveredCourse(null)}
      >
        <img
          src={course.image}
          alt={course.title}
          className="w-full h-48 object-cover pointer-events-none"
        />
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-semibold text-neutral-900">{course.title}</h3>
          <p className="text-neutral-600 mt-2 line-clamp-3 mb-4 flex-1">{course.description}</p>

          <div className="mt-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {course.tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-block bg-neutral-200 text-neutral-700 text-sm px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-neutral-600 text-sm mb-4">Duration: {course.duration}</p>

            {isEnrolled ? (
              <button
                onClick={(e) => handleContinueLearning(e, course)}
                className="inline-block w-full bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 transition text-center"
              >
                Continue Learning
              </button>
            ) : (
              <Link
                className="inline-block w-full bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 transition text-center"
                to={course.link}
              >
                Start Learning
              </Link>
            )}
          </div>
        </div>

        <Transition
          show={hoveredCourse === course.id}
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-x-2"
          enterTo="opacity-100 translate-x-0"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-x-0"
          leaveTo="opacity-0 translate-x-2"
        >
          <div className="absolute top-0 right-0 mr-4 w-80 bg-white rounded-lg shadow-lg p-6 z-20 md:top-0 md:right-0 md:mr-4 sm:top-full sm:left-0 sm:right-auto sm:mt-4 sm:mr-0 border border-gray-100">
            <h4 className="text-lg font-semibold text-neutral-900">{course.title}</h4>
            <h5 className="text-md font-medium text-neutral-700 mt-3">What You'll Learn</h5>
            <ul className="mt-2 space-y-2 text-neutral-600 mb-4">
              {(course.learningOutcomes || []).slice(0, 5).map((outcome, outcomeIndex) => (
                <li key={outcomeIndex} className="flex items-start text-sm">
                  <span className="mr-2">•</span>
                  <span>{outcome}</span>
                </li>
              ))}
              {(course.learningOutcomes || []).length === 0 && (
                <li className="text-neutral-500 italic text-sm">No specific outcomes listed.</li>
              )}
            </ul>
            {isEnrolled ? (
              <button
                onClick={(e) => handleContinueLearning(e, course)}
                className="block w-full text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Enrolled
              </button>
            ) : (
              <button
                onClick={() => enrollCourse(course.id)}
                className="w-full bg-blue-950 text-white py-2 rounded-lg hover:bg-slate-900 transition"
              >
                Enroll Now
              </button>
            )}
          </div>
        </Transition>
      </div>
    </motion.div>
  );
};

const Course = () => {
  const navigate = useNavigate();
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [user, setUser] = useState(null);

  // Fetch courses and enrollment status from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // fetch courses
        const { data: coursesData, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        // fetch enrolled courses if user is logged in
        let enrolledIds = new Set();
        if (currentUser) {
          const { data: enrolledData, error: enrolledError } = await supabase
            .from('courses_enrolled')
            .select('course_id')
            .eq('user_id', currentUser.id);

          if (enrolledError) {
            console.error('Error fetching enrollments:', enrolledError);
          } else if (enrolledData) {
            enrolledIds = new Set(enrolledData.map(item => item.course_id));
          }
        }
        setEnrolledCourseIds(enrolledIds);

        if (coursesData) {
          // Transform data to match component expectations
          const transformedCourses = coursesData.map((course) => {
            // Helper function to parse tags/outcomes safely
            const parseArrayField = (field) => {
              if (!field) return [];
              if (Array.isArray(field)) return field;
              if (typeof field === 'string') {
                // Try to parse as JSON first
                if (field.trim().startsWith('[') || field.trim().startsWith('{')) {
                  try {
                    const parsed = JSON.parse(field);
                    // Ensure the result is an array
                    return Array.isArray(parsed) ? parsed : [parsed];
                  } catch (e) {
                    // If JSON parsing fails, treat as comma-separated
                    return field.split(',').map(item => item.trim()).filter(item => item);
                  }
                }
                // Treat as comma-separated string
                return field.split(',').map(item => item.trim()).filter(item => item);
              }
              return [];
            };

            return {
              id: course.id,
              slug: course.course_slug,
              title: course.title || course.name || 'Untitled Course',
              description: course.description || '',
              // Use image_url from database if available, otherwise fallback to local images
              image: course.image_url || imageMap[course.id] || imageMap[course.id?.toLowerCase()] || frontendImage,
              link: course.link || course.route || `/course/${course.id}`,
              tags: parseArrayField(course.tags),
              duration: course.duration || (course.duration_weeks ? `${course.duration_weeks} weeks` : 'N/A'),
              learningOutcomes: parseArrayField(course.learning_outcomes),
            };
          });

          setCourses(transformedCourses);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch courses');
        toast.error('Failed to load courses. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const enrollCourse = async (courseId) => {
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) {
        toast.error('Please log in to enroll');
        return;
      }

      // Check if already enrolled (double check)
      if (enrolledCourseIds.has(courseId)) {
        toast.info('You are already enrolled in this course.');
        return;
      }

      const { error } = await supabase
        .from('courses_enrolled')
        .insert({ user_id: user.id, course_id: courseId });
      if (error) {
        throw error;
      }

      // Update local state
      setEnrolledCourseIds(prev => new Set(prev).add(courseId));
      toast.success('Enrolled successfully!');
    } catch (err) {
      toast.error('Failed to enroll');
      console.error(err);
    }
  };

  const handleContinueLearning = async (e, course) => {
    e.preventDefault();
    try {
      // Fetch modules for this course
      // We look for modules associated with this course ID
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      if (!allModules || allModules.length === 0) {
        toast.info("We are working on curating contents for you, check back later.");
        return;
      }

      // Find first lesson of the first module that has lessons
      for (const module of allModules) {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', module.id)
          .eq('is_published', true)
          .order('order_index', { ascending: true })
          .limit(1);

        if (lessonsError) {
          console.error(lessonsError);
          continue;
        }

        if (lessons && lessons.length > 0) {
          const lesson = lessons[0];
          // Use slug if available, otherwise fallback to ID
          const courseIdentifier = course.slug || course.id;
          navigate(`/course/${courseIdentifier}/lesson/${lesson.id}`);
          return;
        }
      }

      toast.info("We are working on curating contents for you, check back later.");
    } catch (err) {
      console.error('Error fetching course content:', err);
      toast.error("Failed to load course content. Please try again.");
    }
  };

  // Filter courses
  const enrolledCourses = courses.filter(course => enrolledCourseIds.has(course.id));

  return (
    <section className="bg-neutral-100 py-12 md:py-24 min-h-screen">
      <div className="container mx-auto px-4">

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-900 border-t-transparent"></div>
            <p className="text-neutral-600 mt-4">Loading courses...</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">Error: {error}</p>
            <p className="text-neutral-600 mt-2">Please check your connection and try again.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Your Learning Section - Only show if user is logged in and has enrolled courses */}
            {user && enrolledCourses.length > 0 && (
              <div className="mb-20">
                <h2 className="text-4xl md:text-5xl font-semibold mb-8 tracking-tight font-heading text-blue-950">
                  Your Learning
                </h2>
                <div className="w-full h-px bg-neutral-300 mb-10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-0">
                  {enrolledCourses.map((course, index) => (
                    <CourseCard
                      key={`enrolled-${course.id}`}
                      course={course}
                      index={index}
                      isEnrolled={true}
                      enrollCourse={enrollCourse}
                      handleContinueLearning={handleContinueLearning}
                      setHoveredCourse={setHoveredCourse}
                      hoveredCourse={hoveredCourse}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Courses Section */}
            <div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-semibold mb-8 tracking-tight font-heading text-blue-950">
                All Courses
              </h1>
              <div className="w-full h-px bg-neutral-900 mb-10"></div>

              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600 text-lg">No courses available at the moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-0">
                  {courses.map((course, index) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      index={index}
                      isEnrolled={enrolledCourseIds.has(course.id)}
                      enrollCourse={enrollCourse}
                      handleContinueLearning={handleContinueLearning}
                      setHoveredCourse={setHoveredCourse}
                      hoveredCourse={hoveredCourse}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Course;
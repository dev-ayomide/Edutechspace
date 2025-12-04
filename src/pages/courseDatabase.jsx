import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const CourseDatabase = () => {
  const [hoveredCourse, setHoveredCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses from Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          // Transform data to match component expectations
          const transformedCourses = data.map((course) => {
            // Helper function to parse tags/outcomes safely
            const parseArrayField = (field) => {
              if (!field) return [];
              if (Array.isArray(field)) return field;
              if (typeof field === 'string') {
                // Try to parse as JSON first
                if (field.trim().startsWith('[') || field.trim().startsWith('{')) {
                  try {
                    return JSON.parse(field);
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
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const enrollCourse = async (courseId) => {
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) {
        toast.error('Please log in to enroll');
        return;
      }
      const { error } = await supabase
        .from('courses_enrolled')
        .insert({ user_id: user.id, course_id: courseId });
      if (error) {
        throw error;
      }
      toast.success('Enrolled successfully!');
    } catch (err) {
      toast.error('Failed to enroll');
    }
  };

  return (
    <section className="bg-neutral-100 py-12 md:py-24">
      <div className="container mx-auto px-4">
        <h1 className="text-6xl font-semibold tracking-tight text-neutral-900 text-center">
          Run Tech Course Database
        </h1>
        <p className="text-xl text-neutral-600 text-center mt-4">
          Discover a list of carefully picked courses with certifications to get you started on your tech journey!
        </p>
        
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

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600 text-lg">No courses available at the moment.</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 relative z-0">
            {courses.map((course, index) => (
            <motion.div
              key={course.id}
              variants={courseVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <div
                className="relative bg-white rounded-lg shadow-lg overflow-hidden"
                onMouseEnter={() => {
                  setHoveredCourse(course.id);
                }}
                onMouseLeave={() => {
                  setHoveredCourse(null);
                }}
              >
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-48 object-cover pointer-events-none"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-neutral-900">{course.title}</h3>
                  <p className="text-neutral-600 mt-2 line-clamp-3">{course.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-block bg-neutral-200 text-neutral-700 text-sm px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-neutral-600 mt-2 text-sm">Duration: {course.duration}</p>
                  <Link
                    className="inline-block mt-4 bg-neutral-900 text-white py-2 px-4 rounded-lg hover:bg-neutral-800 transition"
                    to={course.link}
                  >
                    Start Learning
                  </Link>
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
                  <div className="absolute top-0 right-0 mr-4 w-80 bg-white rounded-lg shadow-lg p-6 z-20 md:top-0 md:right-0 md:mr-4 sm:top-full sm:left-0 sm:right-auto sm:mt-4 sm:mr-0">
                    <h4 className="text-lg font-semibold text-neutral-900">{course.title}</h4>
                    <h5 className="text-md font-medium text-neutral-700 mt-3">What You'll Learn</h5>
                    <ul className="mt-2 space-y-2 text-neutral-600">
                      {course.learningOutcomes.map((outcome, outcomeIndex) => (
                        <li key={outcomeIndex} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => enrollCourse(course.id)}
                      className="w-full mt-4 bg-blue-950 text-white py-2 rounded-lg hover:bg-slate-900 transition"
                    >
                      Enroll Now
                    </button>
                  </div>
                </Transition>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CourseDatabase;
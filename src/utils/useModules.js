import { useState, useEffect } from 'react';
import { supabase } from './supabase';

/**
 * Custom hook to fetch modules and lessons for a course
 * @param {string} courseIdOrSlug - The UUID or slug of the course
 * @returns {Object} - { modules, loading, error, refetch }
 */
export const useModules = (courseIdOrSlug) => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModules = async () => {
    if (!courseIdOrSlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, resolve course ID if a slug was provided
      let actualCourseId = courseIdOrSlug;
      
      // Check if it looks like a slug (contains hyphens and lowercase)
      if (courseIdOrSlug.includes('-') && !courseIdOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('course_slug', courseIdOrSlug)
          .single();

        if (courseError) {
          console.error('Error fetching course by slug:', courseError);
          throw new Error(`Course not found with slug: ${courseIdOrSlug}`);
        }
        
        actualCourseId = courseData.id;
      }

      // Fetch modules for the course
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', actualCourseId)
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: lessonsData, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .eq('module_id', module.id)
            .eq('is_published', true)
            .order('order_index', { ascending: true });

          if (lessonsError) {
            console.error(`Error fetching lessons for module ${module.id}:`, lessonsError);
            return { ...module, lessons: [] };
          }

          return {
            ...module,
            lessons: lessonsData || []
          };
        })
      );

      setModules(modulesWithLessons);
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [courseIdOrSlug]);

  return {
    modules,
    loading,
    error,
    refetch: fetchModules
  };
};

/**
 * Custom hook to fetch a single lesson by ID
 * @param {string} lessonId - The ID of the lesson
 * @returns {Object} - { lesson, module, loading, error, refetch }
 */
export const useLesson = (lessonId) => {
  const [lesson, setLesson] = useState(null);
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLesson = async () => {
    if (!lessonId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      setLesson(lessonData);

      // Fetch module
      if (lessonData?.module_id) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', lessonData.module_id)
          .single();

        if (moduleError) throw moduleError;
        setModule(moduleData);
      }
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  return {
    lesson,
    module,
    loading,
    error,
    refetch: fetchLesson
  };
};

/**
 * Custom hook to get all lessons across all modules for a course
 * @param {string} courseId - The ID of the course
 * @returns {Object} - { allLessons, loading, error }
 */
export const useAllCourseLessons = (courseId) => {
  const { modules, loading, error } = useModules(courseId);
  
  const allLessons = modules.flatMap((module) => 
    (module.lessons || []).map((lesson) => ({
      ...lesson,
      module_title: module.title,
      module_id: module.id,
      module_order: module.order_index
    }))
  );

  return { allLessons, loading, error };
};

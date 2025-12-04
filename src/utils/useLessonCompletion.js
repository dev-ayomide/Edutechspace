import { useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';
import { AuthContext } from '../context/AuthProvider';

/**
 * Custom hook to track and manage lesson completion
 * @param {string} lessonId - The ID of the lesson
 * @returns {Object} - { isCompleted, markComplete, markIncomplete, loading, error }
 */
export const useLessonCompletion = (lessonId) => {
  const { user } = useContext(AuthContext);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if lesson is completed
  const checkCompletion = async () => {
    if (!user?.id || !lessonId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      setIsCompleted(!!data);
    } catch (err) {
      console.error('Error checking lesson completion:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark lesson as complete
  const markComplete = async () => {
    if (!user?.id || !lessonId) {
      console.error('User ID or Lesson ID is missing');
      return false;
    }

    try {
      setError(null);

      const { error: insertError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id: user.id,
          lesson_id: lessonId
        });

      if (insertError) {
        // If it's a duplicate key error, it's already completed
        if (insertError.code === '23505') {
          setIsCompleted(true);
          return true;
        }
        throw insertError;
      }

      setIsCompleted(true);
      return true;
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      setError(err.message);
      return false;
    }
  };

  // Mark lesson as incomplete
  const markIncomplete = async () => {
    if (!user?.id || !lessonId) {
      console.error('User ID or Lesson ID is missing');
      return false;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('lesson_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId);

      if (deleteError) throw deleteError;

      setIsCompleted(false);
      return true;
    } catch (err) {
      console.error('Error marking lesson as incomplete:', err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    checkCompletion();
  }, [user?.id, lessonId]);

  return {
    isCompleted,
    markComplete,
    markIncomplete,
    loading,
    error,
    refetch: checkCompletion
  };
};

/**
 * Custom hook to get completion status for multiple lessons
 * @param {Array<string>} lessonIds - Array of lesson IDs
 * @returns {Object} - { completions, loading, error, refetch }
 */
export const useMultipleLessonCompletions = (lessonIds) => {
  const { user } = useContext(AuthContext);
  const [completions, setCompletions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompletions = async () => {
    if (!user?.id || !lessonIds || lessonIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('lesson_completions')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      if (fetchError) throw fetchError;

      // Create a map of lesson_id -> true for completed lessons
      const completionMap = {};
      lessonIds.forEach(id => {
        completionMap[id] = false;
      });
      
      (data || []).forEach(completion => {
        completionMap[completion.lesson_id] = true;
      });

      setCompletions(completionMap);
    } catch (err) {
      console.error('Error fetching lesson completions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletions();
  }, [user?.id, JSON.stringify(lessonIds)]);

  return {
    completions,
    loading,
    error,
    refetch: fetchCompletions
  };
};

/**
 * Custom hook to get module progress
 * @param {string} moduleId - The ID of the module
 * @returns {Object} - { progress, completedLessons, totalLessons, loading, error }
 */
export const useModuleProgress = (moduleId) => {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchModuleProgress = async () => {
      if (!user?.id || !moduleId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all lessons in the module
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', moduleId)
          .eq('is_published', true);

        if (lessonsError) throw lessonsError;

        const total = lessons?.length || 0;
        setTotalLessons(total);

        if (total === 0) {
          setProgress(0);
          setCompletedLessons(0);
          setLoading(false);
          return;
        }

        // Get completed lessons
        const lessonIds = lessons.map(l => l.id);
        const { data: completions, error: completionsError } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (completionsError) throw completionsError;

        const completed = completions?.length || 0;
        setCompletedLessons(completed);
        setProgress(Math.round((completed / total) * 100));
      } catch (err) {
        console.error('Error fetching module progress:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModuleProgress();
  }, [user?.id, moduleId]);

  return {
    progress,
    completedLessons,
    totalLessons,
    loading,
    error
  };
};

/**
 * Custom hook to get course progress with module breakdown
 * @param {string} courseId - The ID of the course
 * @returns {Object} - { overallProgress, moduleProgress, completedLessons, totalLessons, loading, error }
 */
export const useCourseProgress = (courseId) => {
  const { user } = useContext(AuthContext);
  const [overallProgress, setOverallProgress] = useState(0);
  const [moduleProgress, setModuleProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!user?.id || !courseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all modules for the course
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, title')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (modulesError) throw modulesError;

        if (!modules || modules.length === 0) {
          setOverallProgress(0);
          setTotalLessons(0);
          setCompletedLessons(0);
          setLoading(false);
          return;
        }

        // Get all lessons for all modules
        const moduleIds = modules.map(m => m.id);
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, module_id')
          .in('module_id', moduleIds)
          .eq('is_published', true);

        if (lessonsError) throw lessonsError;

        const total = lessons?.length || 0;
        setTotalLessons(total);

        if (total === 0) {
          setOverallProgress(0);
          setCompletedLessons(0);
          setLoading(false);
          return;
        }

        // Get all completions
        const lessonIds = lessons.map(l => l.id);
        const { data: completions, error: completionsError } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (completionsError) throw completionsError;

        const completed = completions?.length || 0;
        setCompletedLessons(completed);
        setOverallProgress(Math.round((completed / total) * 100));

        // Calculate progress per module
        const moduleProgressMap = {};
        modules.forEach(module => {
          const moduleLessons = lessons.filter(l => l.module_id === module.id);
          const moduleCompletions = completions?.filter(c => 
            moduleLessons.some(l => l.id === c.lesson_id)
          ) || [];
          
          const moduleTotal = moduleLessons.length;
          const moduleCompleted = moduleCompletions.length;
          
          moduleProgressMap[module.id] = {
            title: module.title,
            progress: moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0,
            completedLessons: moduleCompleted,
            totalLessons: moduleTotal
          };
        });

        setModuleProgress(moduleProgressMap);
      } catch (err) {
        console.error('Error fetching course progress:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [user?.id, courseId]);

  return {
    overallProgress,
    moduleProgress,
    completedLessons,
    totalLessons,
    loading,
    error
  };
};

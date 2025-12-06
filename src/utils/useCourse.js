
import { useState, useEffect } from 'react';
import { supabase } from './supabase';

/**
 * Custom hook to fetch course details by slug
 * @param {string} slug - The slug of the course
 * @returns {Object} - { course, loading, error }
 */
export const useCourse = (slug) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const { data, error } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('course_slug', slug)
                    .single();

                if (error) throw error;

                setCourse(data);
            } catch (err) {
                console.error('Error fetching course:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [slug]);

    return { course, loading, error };
};

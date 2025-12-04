import { useState, useEffect } from 'react';
import { supabase } from './supabase';

/**
 * Custom hook to fetch course resources from Supabase
 * @param {string} courseType - The course type (e.g., "Frontend Development")
 * @param {Object} defaultImages - Object with videoImages and pdfImages arrays for fallback
 * @returns {Object} { videoResources, pdfResources, loading, error }
 */
export const useCourseResources = (courseType, defaultImages = {}) => {
  const [videoResources, setVideoResources] = useState([]);
  const [pdfResources, setPdfResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch videos
        const { data: videos, error: videoError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_type', courseType)
          .eq('resource_type', 'Video')
          .order('created_at', { ascending: false });

        // Fetch PDFs
        const { data: pdfs, error: pdfError } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_type', courseType)
          .eq('resource_type', 'PDF')
          .order('created_at', { ascending: false });

        if (videoError) {
          console.error('Error fetching videos:', videoError);
          setError(videoError.message);
        }
        if (pdfError) {
          console.error('Error fetching PDFs:', pdfError);
          setError(pdfError.message);
        }

        // Map resources with default images if no thumbnail
        const videoImages = defaultImages.videoImages || [];
        const pdfImages = defaultImages.pdfImages || [];

        const mappedVideos = (videos || []).map((video, idx) => ({
          ...video,
          image: video.thumbnail_url || videoImages[idx % videoImages.length] || null,
          duration: video.duration || 'N/A'
        }));

        const mappedPdfs = (pdfs || []).map((pdf, idx) => ({
          ...pdf,
          image: pdf.thumbnail_url || pdfImages[idx % pdfImages.length] || null
        }));

        setVideoResources(mappedVideos);
        setPdfResources(mappedPdfs);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseType) {
      fetchResources();
    }
  }, [courseType, defaultImages]);

  return { videoResources, pdfResources, loading, error };
};


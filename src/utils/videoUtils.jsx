import React from 'react';

/**
 * Converts YouTube URLs to embed format
 * @param {string} url - YouTube URL (watch, youtu.be, or embed)
 * @returns {string} - Embed URL or original URL if not YouTube
 */
export const convertYouTubeUrl = (url) => {
  if (!url) return url;
  
  // Already an embed URL
  if (url.includes('youtube.com/embed')) {
    return url;
  }
  
  // YouTube watch URL: https://youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // YouTube short URL: https://youtu.be/VIDEO_ID
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  // Return original URL if not YouTube
  return url;
};

/**
 * Checks if a URL is a YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export const isYouTubeUrl = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

/**
 * Renders video player component based on URL type
 * @param {string} url - Video URL
 * @param {string} title - Video title for accessibility
 * @param {string} className - CSS classes
 * @returns {JSX.Element} - Video player component
 */
export const renderVideoPlayer = (url, title, className = 'w-full h-[500px] rounded mb-4') => {
  const convertedUrl = convertYouTubeUrl(url);
  const isYouTube = isYouTubeUrl(url);
  
  if (isYouTube) {
    return (
      <iframe
        title={title}
        src={convertedUrl}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  } else {
    return (
      <video 
        controls 
        className={className}
        src={convertedUrl}
      ></video>
    );
  }
};


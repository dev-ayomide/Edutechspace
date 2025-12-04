import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { supabase } from "../../utils/supabase";
import { renderVideoPlayer } from "../../utils/videoUtils";

const UIUXVideoPdfModal = ({ type, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isVideo = type === 'video';
  const courseType = "UI/UX Design"; // This is fixed for this component

  // Fetch resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('course_resources')
          .select('*')
          .eq('course_type', courseType)
          .eq('resource_type', isVideo ? 'Video' : 'PDF')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setResources(data);
        } else {
          setResources([]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
        setError('Failed to load resources. Please try again later.');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, [courseType, isVideo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // Load saved index
  useEffect(() => {
    if (resources.length > 0) {
      const savedIndex = localStorage.getItem(`current-${type}-index-${courseType}`);
      if (savedIndex) {
        const idx = parseInt(savedIndex);
        if (idx >= 0 && idx < resources.length) {
          setCurrentIndex(idx);
        }
      }
    }
  }, [type, courseType, resources.length]);

  // Save current index
  useEffect(() => {
    if (resources.length > 0) {
      localStorage.setItem(`current-${type}-index-${courseType}`, currentIndex);
    }
  }, [currentIndex, type, courseType, resources.length]);

  const next = () => {
    if (currentIndex < resources.length - 1) setCurrentIndex(currentIndex + 1);
  };
  
  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // Show loading state
  if (loading) {
    return (
      <Dialog open={true} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
        <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading resources...</p>
          </div>
        </DialogPanel>
      </Dialog>
    );
  }

  // Show error state
  if (error) {
    return (
      <Dialog open={true} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
        <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
          <DialogTitle className="text-xl sm:text-2xl font-bold mb-4 text-center">Error</DialogTitle>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={onClose} className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-blue-800 transition">Close</button>
          </div>
        </DialogPanel>
      </Dialog>
    );
  }

  // Show empty state
  if (!loading && resources.length === 0) {
    return (
      <Dialog open={true} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
        <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
          <DialogTitle className="text-xl sm:text-2xl font-bold mb-4 text-center">No Resources Available</DialogTitle>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">There are no {isVideo ? 'video' : 'PDF'} resources available for this course yet.</p>
            <button onClick={onClose} className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-blue-800 transition">Close</button>
          </div>
        </DialogPanel>
      </Dialog>
    );
  }

  // Get current resource
  if (resources.length === 0) return null;
  const currentResource = resources[currentIndex];

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogTitle className="text-xl sm:text-2xl font-bold mb-4 text-center">{currentResource.title}</DialogTitle>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <button onClick={prev} disabled={currentIndex === 0} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50">Previous</button>
          <span className="text-sm sm:text-base">{currentIndex + 1} / {resources.length}</span>
          <button onClick={next} disabled={currentIndex === resources.length - 1} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50">Next</button>
        </div>

        {isVideo ? (
          renderVideoPlayer(
            currentResource.resource_url,
            currentResource.title,
            "w-full h-[200px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded mb-4"
          )
        ) : (
          <iframe
            title={currentResource.title}
            src={currentResource.resource_url}
            className="w-full h-[400px] sm:h-[500px] rounded mb-4"
          ></iframe>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 my-4">
          {resources.map((_, idx) => (
            <span
              onClick={() => setCurrentIndex(idx)}
              key={idx}
              className={`h-2 w-2 rounded-full cursor-pointer transition-all duration-300 ${idx === currentIndex ? 'bg-blue-900 scale-125' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Course Details */}
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          {isVideo && currentResource.requirement && (
            <>
              <h3 className="text-lg font-semibold mb-2">Requirement</h3>
              <p className="text-sm text-gray-700 mb-3">{currentResource.requirement}</p>
            </>
          )}
          
          <h3 className="text-lg font-semibold mb-2">{isVideo ? "Description" : "Details"}</h3>
          <p className="text-sm text-gray-700">{currentResource.description}</p>
          
          {/* Show uploaded date if available */}
          {currentResource.created_at && (
            <p className="text-xs text-gray-500 mt-4">
              Uploaded: {new Date(currentResource.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full bg-blue-950 text-white py-3 rounded-lg text-lg hover:bg-blue-800 transition">Close</button>
      </DialogPanel>
    </Dialog>
  );
};

export default UIUXVideoPdfModal;

import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { renderVideoPlayer } from "../../utils/videoUtils";

const AIVideoPdfModal = ({ onClose, resources = [], startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Update currentIndex when startIndex changes/modal opens
  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  const next = () => {
    if (currentIndex < resources.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!resources || resources.length === 0) return null;

  const currentResource = resources[currentIndex];
  // Determine if video based on resource_type or fallback logic
  const isVideo = currentResource.resource_type === 'Video' || currentResource.type === 'video';

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <DialogPanel className="bg-white p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogTitle className="text-xl sm:text-2xl font-bold mb-4 text-center">{currentResource.title}</DialogTitle>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <button onClick={prev} disabled={currentIndex === 0} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition">Previous</button>
          <span className="text-sm sm:text-base">{currentIndex + 1} / {resources.length}</span>
          <button onClick={next} disabled={currentIndex === resources.length - 1} className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300 transition">Next</button>
        </div>

        {isVideo ? (
          <div className="mt-4">
            {renderVideoPlayer(
              currentResource.resource_url,
              currentResource.title,
              "w-full h-[200px] sm:h-[350px] md:h-[450px] lg:h-[500px] rounded mb-4"
            )}
          </div>
        ) : (
          <iframe
            title={currentResource.title}
            src={currentResource.resource_url}
            className="w-full h-[400px] sm:h-[500px] rounded mb-4 mt-4"
          ></iframe>
        )}

        {/* Progress Indicator */}
        <div className="flex justify-center flex-wrap gap-2 my-4">
          {resources.map((_, idx) => (
            <span
              onClick={() => setCurrentIndex(idx)}
              key={idx}
              className={`h-2 w-2 rounded-full cursor-pointer transition-all duration-300 ${idx === currentIndex ? 'bg-blue-900 scale-125' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        {/* Resource Details */}
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          {isVideo && currentResource.requirement && (
            <>
              <h3 className="text-lg font-semibold mb-2">Requirement</h3>
              <p className="text-sm text-gray-700 mb-3">{currentResource.requirement}</p>
            </>
          )}

          <h3 className="text-lg font-semibold mb-2">{isVideo ? "Description" : "Details"}</h3>
          <p className="text-sm text-gray-700">{currentResource.description || "No description available."}</p>

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

export default AIVideoPdfModal;
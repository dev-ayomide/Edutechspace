// LogoutDialog.jsx
import React, { useContext } from 'react';
import { Dialog,DialogPanel,DialogTitle } from '@headlessui/react';
import { AuthContext } from '../../context/AuthProvider';

const LogoutDialog = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);

  const handleConfirmLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, close the dialog
      onClose();
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-[9999]"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <DialogPanel 
          className="bg-white p-6 rounded-lg shadow-lg text-center w-80 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogTitle className="text-lg font-medium text-neutral-900">
            Are you sure you want to logout?
          </DialogTitle>
          <div className="mt-4 flex justify-center space-x-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirmLogout(e);
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Yes, Logout
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 text-neutral-900 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default LogoutDialog;

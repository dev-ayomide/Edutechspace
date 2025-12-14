import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import { supabase } from "../utils/supabase";
import Cookies from 'js-cookie';

const UserProfile = () => {
  const { user, loading, fetchProfile, deleteAccount } = useContext(AuthContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user && !loading) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !Cookies.get('token')) {
          toast.error('Authentication failed. Please log in again.');
          navigate('/login');
          return;
        }
        const loadProfile = async () => {
          try {
            await fetchProfile();
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        };
        loadProfile();
      }
    };
    checkProfile();
  }, [user, loading, fetchProfile, navigate]);

  useEffect(() => {
    if (user && user.name) {
      const nameParts = user.name.trim().split(" ");
      const newFirstName = nameParts[0] || "";
      const newLastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
      setFirstName(newFirstName);
      setLastName(newLastName);
    } else {
      setFirstName("");
      setLastName("");
    }
  }, [user]);

  const handleDeleteConfirmation = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Account deleted successfully.');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No profile data available</p>
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header background */}
      <div className="bg-blue-950 h-48 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/50 to-blue-950"></div>
      </div>

      {/* Profile content */}
      <div className="max-w-4xl mx-auto px-6 -mt-24 relative z-10 pb-12">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile header */}
          <div className="p-8 text-center border-b border-gray-100">
            <div className="relative inline-block">
              <img
                src={user.picture || "https://i.pravatar.cc/300"}
                alt={user.name || "User"}
                className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-lg"
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-4">
              {user.name || 'Unknown User'}
            </h1>
            <p className="text-gray-500 mt-1">{user.email || 'No email'}</p>

            {/* Stats */}
            <div className="flex justify-center gap-12 mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{user.ongoingcourses || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Ongoing</p>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{user.completedcourses || 0}</div>
                <p className="text-sm text-gray-500 mt-1">Completed</p>
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Profile Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  First Name
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                  {firstName || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Last Name
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                  {lastName || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                  {user.email || 'Not provided'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Phone Number
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-800">
                  {user.phone || 'Not provided'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link
                to="/course"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Transition appear show={deleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { }}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Delete Account?
                  </DialogTitle>
                  <p className="mt-3 text-gray-600">
                    This will permanently delete your account and all your data. This action cannot be undone.
                  </p>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                      onClick={handleCancelDelete}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors font-medium"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </button>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default UserProfile;
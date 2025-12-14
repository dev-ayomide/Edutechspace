import React, { useState, useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logoiii from "../assets/images/logoii.png";
import LogoutDialog from "./dialog/LogoutDialog";
import { Bars3Icon, XMarkIcon, BellIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthProvider";

const Navbar = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.picture]);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md border border-white/10">
        <nav className="px-6 md:px-10 py-3 md:py-4">
          <div className="relative flex items-center justify-between">
            <NavLink to="/" className="relative z-10 pr-4 xl:pr-0">
              <img className="h-7 md:h-8" src={logoiii} alt="RUNTechSpace Logo" />
            </NavLink>
            <div className="hidden xl:flex xl:justify-center gap-16 xl:absolute xl:w-full xl:top-1/2 xl:left-1/2 xl:-translate-y-1/2 xl:-translate-x-1/2">
              <NavLink className="navlinks" to="/">
                Home
              </NavLink>
              <NavLink className="navlinks" to="/course">
                All Courses
              </NavLink>
              <NavLink className="navlinks" to="/certification-exam">
                RTS Certification Exams
              </NavLink>
              <NavLink className="navlinks" to="/about-us">
                About us
              </NavLink>
            </div>
            <div className="flex items-center space-x-3 md:space-x-4">
              {!isAuthenticated ? (
                <>
                  <NavLink
                    to="/login"
                    className="bg-slate-200 text-blue-950 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-950 hover:text-white transition-all cursor-pointer relative z-10"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="bg-slate-200 text-blue-950 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-950 hover:text-white transition-all cursor-pointer relative z-10 hidden sm:block"
                  >
                    Signup
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/notifications" className="cursor-pointer">
                    <BellIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-950 hover:text-slate-900 transition" />
                  </NavLink>
                  <NavLink to="/profile" className="cursor-pointer">
                    {user?.picture && !imageError ? (
                      <img
                        src={user.picture}
                        alt={user?.name || "User"}
                        className="w-8 h-8 md:w-9 md:h-9 object-cover rounded-full border-2 border-blue-950"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-blue-950 bg-blue-950 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                        {user?.name
                          ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                          : "U"}
                      </div>
                    )}
                  </NavLink>
                  <button
                    className="bg-slate-200 text-blue-950 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-950 hover:text-white transition-all hidden xl:block cursor-pointer relative z-10"
                    onClick={() => setShowLogoutModal(true)}
                    type="button"
                  >
                    Logout
                  </button>
                </>
              )}
              <button
                className="xl:hidden p-1"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                <Bars3Icon className="w-6 h-6 text-slate-900" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <LogoutDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
      />

      {mobileNavOpen && (
        <div className="fixed top-0 left-0 bottom-0 w-5/6 max-w-xs z-[9999]">
          <div
            className="fixed inset-0 bg-black opacity-20"
            onClick={() => setMobileNavOpen(false)}
          ></div>
          <nav className="relative p-8 w-full h-full bg-white overflow-y-auto">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <NavLink
                  className="pr-4"
                  to="/"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <img className="h-10" src={logoiii} alt="RUNTechSpace Logo" />
                </NavLink>
                <button onClick={() => setMobileNavOpen(false)}>
                  <XMarkIcon className="w-8 h-8 text-black" />
                </button>
              </div>
              <div className="flex flex-col gap-8 py-16">
                <NavLink
                  className="max-w-max navlinks"
                  to="/"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  className="max-w-max navlinks"
                  to="/course"
                  onClick={() => setMobileNavOpen(false)}
                >
                  All Courses
                </NavLink>
                <NavLink
                  className="max-w-max navlinks"
                  to="/certification-exam"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Certification Exams
                </NavLink>
                {isAuthenticated && (
                  <>
                    {/* Notifications route not implemented yet - commenting out to prevent 404 */}
                    {/* 
                    <NavLink
                      className="max-w-max navlinks"
                      to="/notifications"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      Notifications
                    </NavLink>
                    */}
                    <button
                      type="button"
                      className="max-w-max navlinks text-left cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMobileNavOpen(false);
                        setShowLogoutModal(true);
                      }}
                    >
                      <span className="pointer-events-none">Logout</span>
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <NavLink
                  className="inline-flex justify-center items-center text-center w-full h-12 p-5 font-medium tracking-tight text-lg hover:text-white focus:text-white bg-transparent hover:bg-neutral-900 focus:bg-neutral-900 border border-neutral-900 rounded-lg focus:ring-4 focus:ring-neutral-400 transition duration-200"
                  to="/support"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Contact us
                </NavLink>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;

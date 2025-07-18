import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ⬅️ For navigation
import { useAuth } from "../context/AuthContext"; // ⬅️ Your auth hook

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // ⬅️ Real user info from context
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout(); // 🔐 Logs out user
    navigate("/login"); // 🔁 Redirects to login
  };

  const handleNavigation = (path) => {
    navigate(path); // ✅ This actually navigates now
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const commonLinks = [
    { to: "/doctors", label: "Find a Doctor", icon: "🏥" },
    { to: "/health-education", label: "Health Articles", icon: "📚" },
    { to: "/find-donors", label: "Find Donors", icon: "🩸" },
  ];

  const patientLinks = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/my-appointments", label: "My Appointments", icon: "📅" },
    { to: "/medication-reminders", label: "My Reminders", icon: "💊" },
    { to: "/health-records", label: "My Records", icon: "📋" },
  ];

  const doctorLinks = [
    { to: "/doctor-dashboard", label: "Dashboard", icon: "🏥" },
    { to: "/doctor-profile", label: "Profile", icon: "👨‍⚕️" },
    { to: "/manage-schedule", label: "My Schedule", icon: "📅" },
  ];

  const getUserLinks = () => {
    if (user?.role === "patient") return patientLinks;
    if (user?.role === "doctor") return doctorLinks;
    return [];
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <button
              onClick={() => handleNavigation("/")}
              className="group relative text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-300 hover:to-blue-300 transition-all duration-300"
            >
              <span className="relative z-10">
                Health<span className="text-green-400">Connect</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {commonLinks.map((link) => (
                <NavLink
                  key={link.to}
                  onClick={() => handleNavigation(link.to)}
                  icon={link.icon}
                  label={link.label}
                />
              ))}
              {user && getUserLinks().length > 0 && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "user" ? null : "user"
                      )
                    }
                    className="group relative px-4 py-2 text-white/90 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
                  >
                    <span className="text-lg">👤</span>
                    <span>My Account</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-300 ${
                        activeDropdown === "user" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {activeDropdown === "user" && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-fade-in">
                      {getUserLinks().map((link) => (
                        <button
                          key={link.to}
                          onClick={() => handleNavigation(link.to)}
                          className="w-full text-left px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span>{link.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-white/80">
                      Welcome,{" "}
                    </span>
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="group relative px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-red-500/50"
                  >
                    <span className="relative z-10">Logout</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleNavigation("/login")}
                    className="text-white/90 hover:text-white font-medium px-4 py-2 rounded-xl hover:bg-white/10 transition-all duration-300"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation("/signup")}
                    className="group relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute top-20 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden animate-slide-down">
            <div className="p-6 space-y-4">
              {commonLinks.map((link) => (
                <button
                  key={link.to}
                  onClick={() => handleNavigation(link.to)}
                  className="w-full text-left px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center space-x-3"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </button>
              ))}
              {user &&
                getUserLinks().map((link) => (
                  <button
                    key={link.to}
                    onClick={() => handleNavigation(link.to)}
                    className="w-full text-left px-4 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 flex items-center space-x-3"
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

const NavLink = ({ onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="group relative px-4 py-2 text-white/90 hover:text-white font-medium rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
  </button>
);

export default Navbar;

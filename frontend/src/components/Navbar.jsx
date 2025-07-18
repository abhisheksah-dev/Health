import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const commonLinks = [
    { to: "/doctors", label: "Find a Doctor" },
    { to: "/health-education", label: "Health Articles" },
    { to: "/find-donors", label: "Find Donors" },
  ];

  const patientLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/my-appointments", label: "My Appointments" },
    { to: "/medication-reminders", label: "My Reminders" }, // NEW LINK
    { to: "/health-records", label: "My Records" },
  ];

  const doctorLinks = [
    { to: "/doctor-dashboard", label: "Dashboard" },
    { to: "/doctor-profile", label: "Profile" },
    { to: "/manage-schedule", label: "My Schedule" },
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Health<span className="text-green-500">Connect</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          {commonLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-600 hover:text-blue-600 transition"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "patient" &&
            patientLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-blue-600 transition"
              >
                {link.label}
              </Link>
            ))}
          {user?.role === "doctor" &&
            doctorLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-blue-600 transition"
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

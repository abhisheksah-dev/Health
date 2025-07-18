import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // ✅ IMPORT: Added Link
import api from "../services/api"; // ✅ IMPORT: Added api for backend calls
import { useAuth } from "../context/AuthContext"; // ✅ IMPORT: Added useAuth for state management

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ HOOK: Get the real login function from context

  // Effect for mouse follower and initial animation (no changes here)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    setIsVisible(true);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ UPDATED: Replaced mock logic with the real API call from your first component
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", formData);
      const { user, token } = res.data.data;

      // Use the login function from AuthContext
      login(user, token);

      // Redirect based on user role
      if (user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Blobs and Mouse Follower (No changes) */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      <div
        className="fixed w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full pointer-events-none z-50 opacity-50 blur-sm transition-all duration-300"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
      ></div>

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md transform transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <span className="text-3xl">🏥</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-300 text-sm">
                Sign in to your HealthConnect account
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">📧</span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <span>{showPassword ? "🙈" : "👁️"}</span>
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </button>
            </form>

            {/* Links */}
            <div className="mt-8 space-y-4">
              <div className="text-center">
                {/* ✅ IMPROVEMENT: Use Link component for semantic navigation */}
                <Link
                  to="/forgot-password"
                  className="text-purple-300 hover:text-purple-200 text-sm font-medium hover:underline transition-colors duration-300"
                >
                  Forgot your password?
                </Link>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-gray-300 text-sm">Don't have an account?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/signup"
                    className="group relative px-4 py-2 bg-transparent border border-green-400 text-green-300 rounded-xl font-medium hover:bg-green-400 hover:text-white transform hover:scale-105 transition-all duration-300 text-sm"
                  >
                    <span className="relative z-10">Sign up as Patient</span>
                  </Link>
                  <Link
                    to="/signup-doctor"
                    className="group relative px-4 py-2 bg-transparent border border-blue-400 text-blue-300 rounded-xl font-medium hover:bg-blue-400 hover:text-white transform hover:scale-105 transition-all duration-300 text-sm"
                  >
                    <span className="relative z-10">Sign up as Doctor</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Particles (no changes) */}
    </div>
  );
};

export default Login;

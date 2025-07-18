import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  // --- Core State and Hooks (Functionality is preserved) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // --- UI-specific State ---
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // --- Effect for initial animation ---
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // --- Handlers (Functionality is preserved) ---
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      return setError("Passwords do not match.");
    }
    // Password length validation can also be added here if needed
    // if (formData.password.length < 8) {
    //   return setError("Password must be at least 8 characters long.");
    // }

    setLoading(true);
    try {
      const res = await api.post("/auth/register/patient", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        phone: formData.phoneNumber, // Ensure API expects 'phone' if that's the case
      });

      login(res.data.data.user, res.data.token);

      // A more elegant notification can be implemented later
      alert(
        "Registration successful! Please check your email for verification."
      );
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Signup failed. Please check your inputs and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- JSX with New Elegant UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Signup Card */}
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
                  <span className="text-3xl">📝</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-300 text-sm">
                Join HealthConnect to manage your health journey
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">👤</span>
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="Full Name"
                  required
                />
              </div>

              {/* Email Input */}
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
                  placeholder="Email Address"
                  required
                />
              </div>

              {/* Password Input */}
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
                  placeholder="Password (min. 8 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                >
                  <span>{showPassword ? "🙈" : "👁️"}</span>
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔑</span>
                </div>
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordConfirm(!showPasswordConfirm)
                  }
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                >
                  <span>{showPasswordConfirm ? "🙈" : "👁️"}</span>
                </button>
              </div>

              {/* Phone Number Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">📞</span>
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300"
                  placeholder="Phone Number (Optional)"
                />
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-8">
              <p className="text-gray-300 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-purple-300 hover:text-purple-200 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
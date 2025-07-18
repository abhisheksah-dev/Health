import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api"; // ✅ Correction: Use the custom api instance
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // ✅ Correction: The entire response is `res.data`
      const res = await api.post("/auth/login", formData);
      const { user, token } = res.data.data;

      login(user, token);

      // ✅ Improvement: Redirect based on role after login
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Welcome Back!
        </h2>

        {errorMsg && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-sm text-center mt-6 space-y-2">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
            Forgot Password?
          </Link>
          <p className="text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-green-600 hover:underline"
            >
              Sign up as a Patient
            </Link>
            {" or "}
            <Link
              to="/signup-doctor"
              className="font-semibold text-green-600 hover:underline"
            >
              as a Doctor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

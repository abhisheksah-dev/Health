import React, { useState } from "react";
import api from "../services/api"; // ✅ Correction: Use the custom api instance
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // ✅ Correction: Use correct endpoint and api instance
      const res = await api.post("/auth/register/patient", formData);

      // ✅ Improvement: Auto-login after successful registration
      login(res.data.data.user, res.data.token);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Create Patient Account
        </h2>

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="input"
            required
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            type="email"
            className="input"
            required
          />
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password (min. 8 characters)"
            type="password"
            className="input"
            required
          />
          <input
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="Confirm Password"
            type="password"
            className="input"
            required
          />
          <input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Phone Number (Optional)"
            type="tel"
            className="input"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-green-600 hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

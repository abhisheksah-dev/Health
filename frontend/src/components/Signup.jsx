import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "male",
    dob: "",
    address: "",
    bloodGroup: "O+",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations before sending to backend
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    const phoneRegex = /^\+?\d{10,15}$/;
    if (form.phone && !phoneRegex.test(form.phone)) {
      return setError("Invalid phone number format");
    }

    try {
      setLoading(true);
      const { confirmPassword, ...dataToSend } = form;
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/register`,
        dataToSend,
        { withCredentials: true }
      );
      localStorage.setItem("accessToken", res.data.accessToken);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Signup failed. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-lg space-y-4"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Sign Up</h2>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {/* Name, Email, Password */}
        <div>
          <label className="block mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block mb-1" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block mb-1" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. +1234567890"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Gender & DOB */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block mb-1" htmlFor="dob">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block mb-1" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={2}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Blood Group */}
        <div>
          <label className="block mb-1" htmlFor="bloodGroup">
            Blood Group
          </label>
          <select
            id="bloodGroup"
            name="bloodGroup"
            value={form.bloodGroup}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-400"
          >
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

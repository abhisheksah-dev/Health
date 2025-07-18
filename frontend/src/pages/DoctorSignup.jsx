import React, { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const DoctorSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    dateOfBirth: "", // State for DOB
    gender: "male",
    address: { street: "", city: "", state: "", country: "", zipCode: "" },
    specializations: [{ name: "" }],
    qualifications: [{ degree: "", institution: "", year: "", country: "" }],
    licenseNumber: "",
    registrationNumber: "",
    consultationFee: "",
    languages: "",
    council: { name: "", year: "", country: "" },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e, index, section) => {
    const { name, value } = e.target;
    if (section) {
      const list = [...formData[section]];
      list[index][name] = value;
      setFormData((prev) => ({ ...prev, [section]: list }));
    } else if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddField = (section) => {
    setFormData((prev) => ({
      ...prev,
      [section]: [
        ...prev[section],
        section === "specializations"
          ? { name: "" }
          : { degree: "", institution: "", year: "", country: "" },
      ],
    }));
  };

  const handleRemoveField = (index, section) => {
    const list = [...formData[section]];
    list.splice(index, 1);
    setFormData((prev) => ({ ...prev, [section]: list }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        languages: formData.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        consultationFee: parseFloat(formData.consultationFee),
      };

      await api.post("/auth/register/doctor", payload);
      alert(
        "Registration successful! Please check your email to verify your account."
      );
      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl w-full bg-white p-8 shadow-lg rounded-lg space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-blue-600">
          Doctor Registration
        </h2>
        {error && (
          <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        {/* --- Personal Details Section --- */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Personal Details</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="input"
            />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="input"
            />
            <input
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              className="input"
            />
            {/* ========== ADD THIS ENTIRE DIV BLOCK ========== */}
            <div>
              <label htmlFor="dateOfBirth" className="text-sm text-gray-500 pl-1">Date of Birth</label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="input"
              />
            </div>
            {/* ================================================ */}
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </fieldset>
        
        {/* --- Account Security Section --- */}
        <fieldset className="border p-4 rounded">
           <legend className="font-semibold px-2">Account Security</legend>
           <div className="grid md:grid-cols-2 gap-4">
             <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="input"
              />
              <input
                name="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                className="input"
              />
           </div>
        </fieldset>

        {/* Professional Details */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Professional Details</legend>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="License Number"
              required
              className="input"
            />
            <input
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="Registration Number"
              required
              className="input"
            />
            <input
              name="consultationFee"
              type="number"
              value={formData.consultationFee}
              onChange={handleChange}
              placeholder="Consultation Fee"
              required
              className="input"
            />
            <input
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              placeholder="Languages (comma-separated)"
              required
              className="input"
            />
          </div>
        </fieldset>

        {/* Council Details */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Medical Council</legend>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              name="council.name"
              value={formData.council.name}
              onChange={handleChange}
              placeholder="Council Name"
              className="input"
            />
            <input
              name="council.year"
              type="number"
              value={formData.council.year}
              onChange={handleChange}
              placeholder="Registration Year"
              className="input"
            />
            <input
              name="council.country"
              value={formData.council.country}
              onChange={handleChange}
              placeholder="Country"
              className="input"
            />
          </div>
        </fieldset>

        {/* Qualifications */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Qualifications</legend>
          {formData.qualifications.map((q, i) => (
            <div
              key={i}
              className="grid md:grid-cols-5 gap-2 mb-2 items-center"
            >
              <input
                name="degree"
                value={q.degree}
                onChange={(e) => handleChange(e, i, "qualifications")}
                placeholder="Degree"
                className="input md:col-span-1"
              />
              <input
                name="institution"
                value={q.institution}
                onChange={(e) => handleChange(e, i, "qualifications")}
                placeholder="Institution"
                className="input md:col-span-2"
              />
              <input
                name="year"
                type="number"
                value={q.year}
                onChange={(e) => handleChange(e, i, "qualifications")}
                placeholder="Year"
                className="input"
              />
              <input
                name="country"
                value={q.country}
                onChange={(e) => handleChange(e, i, "qualifications")}
                placeholder="Country"
                className="input"
              />
              {formData.qualifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField(i, "qualifications")}
                  className="text-red-500 font-bold"
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddField("qualifications")}
            className="text-blue-500 text-sm mt-2"
          >
            + Add Qualification
          </button>
        </fieldset>

        {/* Specializations */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold px-2">Specializations</legend>
          {formData.specializations.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input
                name="name"
                value={s.name}
                onChange={(e) => handleChange(e, i, "specializations")}
                placeholder="Specialization"
                className="input"
              />
              {formData.specializations.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveField(i, "specializations")}
                  className="text-red-500 font-bold"
                >
                  X
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleAddField("specializations")}
            className="text-blue-500 text-sm mt-2"
          >
            + Add Specialization
          </button>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all font-semibold"
        >
          {loading ? "Registering..." : "Register as Doctor"}
        </button>
      </form>
    </div>
  );
};

export default DoctorSignup;
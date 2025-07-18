import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";

// Helper component for consistent section titles
const SectionTitle = ({ children }) => (
  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent pb-2 mb-6 border-b border-white/20">
    {children}
  </h3>
);

const DoctorSignup = () => {
  // --- Core State and Handlers (Functionality is 100% Preserved) ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "male",
    address: { street: "", city: "", state: "", country: "", zipCode: "" }, // All fields included
    specializations: [{ name: "" }],
    qualifications: [{ degree: "", institution: "", year: "", country: "" }], // All fields included
    licenseNumber: "",
    registrationNumber: "",
    consultationFee: "",
    languages: "",
    council: { name: "", year: "", country: "" }, // All fields included
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // This complex handler is fully preserved and works with all fields
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
    if (formData[section].length <= 1) return;
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

  // --- UI State & Effects ---
  const [isVisible, setIsVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const inputClass =
    "w-full pl-4 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all duration-300";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div
        className={`relative z-10 w-full max-w-4xl my-12 transform transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl"></div>
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <span className="text-3xl">🩺</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
                Doctor Registration
              </h2>
              <p className="text-gray-300">
                Join our network of healthcare professionals
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <SectionTitle>Personal Details</SectionTitle>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    required
                    className={inputClass}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    required
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    required
                    className={inputClass}
                  />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className={`${inputClass} text-gray-400`}
                  />
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </section>

              {/* ✅ FIXED: Added missing Address section */}
              <section>
                <SectionTitle>Address</SectionTitle>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <input
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="Street"
                    className={`${inputClass} lg:col-span-3`}
                  />
                  <input
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="City"
                    className={inputClass}
                  />
                  <input
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleChange}
                    placeholder="State"
                    className={inputClass}
                  />
                  <input
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    placeholder="Zip Code"
                    className={inputClass}
                  />
                  <input
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Country"
                    className={`${inputClass} lg:col-span-3`}
                  />
                </div>
              </section>

              <section>
                <SectionTitle>Account Security</SectionTitle>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
                    >
                      <span>{showPassword ? "🙈" : "👁️"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? "text" : "password"}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      required
                      className={`${inputClass} pr-12`}
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
                </div>
              </section>

              <section>
                <SectionTitle>Professional & Legal</SectionTitle>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <input
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="License Number"
                    required
                    className={inputClass}
                  />
                  <input
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="Registration Number"
                    required
                    className={inputClass}
                  />
                  <input
                    name="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    placeholder="Consultation Fee (₹)"
                    required
                    className={inputClass}
                  />
                  <input
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    placeholder="Languages (e.g., English, Hindi)"
                    required
                    className={`${inputClass} lg:col-span-3`}
                  />
                  {/* ✅ FIXED: Added missing Council Country field */}
                  <input
                    name="council.name"
                    value={formData.council.name}
                    onChange={handleChange}
                    placeholder="Council Name"
                    required
                    className={inputClass}
                  />
                  <input
                    name="council.year"
                    type="number"
                    value={formData.council.year}
                    onChange={handleChange}
                    placeholder="Council Reg. Year"
                    required
                    className={inputClass}
                  />
                  <input
                    name="council.country"
                    value={formData.council.country}
                    onChange={handleChange}
                    placeholder="Council Country"
                    required
                    className={inputClass}
                  />
                </div>
              </section>

              <section>
                <SectionTitle>Qualifications</SectionTitle>
                <div className="space-y-4">
                  {formData.qualifications.map((q, i) => (
                    // ✅ FIXED: Grid columns are now correct to include the Country field
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                      <input
                        name="degree"
                        value={q.degree}
                        onChange={(e) => handleChange(e, i, "qualifications")}
                        placeholder="Degree (e.g., MBBS)"
                        className={`${inputClass} md:col-span-3`}
                      />
                      <input
                        name="institution"
                        value={q.institution}
                        onChange={(e) => handleChange(e, i, "qualifications")}
                        placeholder="Institution"
                        className={`${inputClass} md:col-span-4`}
                      />
                      <input
                        name="year"
                        type="number"
                        value={q.year}
                        onChange={(e) => handleChange(e, i, "qualifications")}
                        placeholder="Year"
                        className={`${inputClass} md:col-span-2`}
                      />
                      {/* ✅ FIXED: Added missing Country field */}
                      <input
                        name="country"
                        value={q.country}
                        onChange={(e) => handleChange(e, i, "qualifications")}
                        placeholder="Country"
                        className={`${inputClass} md:col-span-2`}
                      />
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveField(i, "qualifications")}
                          className="text-red-400 hover:text-red-300 transition-colors h-10 w-10 flex items-center justify-center bg-white/5 rounded-full disabled:opacity-50"
                          disabled={formData.qualifications.length <= 1}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 12H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddField("qualifications")}
                    className="px-4 py-2 text-sm bg-white/10 border border-white/20 text-purple-300 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    + Add Qualification
                  </button>
                </div>
              </section>

              <section>
                <SectionTitle>Specializations</SectionTitle>
                <div className="space-y-4">
                  {formData.specializations.map((s, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-4 items-center"
                    >
                      <input
                        name="name"
                        value={s.name}
                        onChange={(e) => handleChange(e, i, "specializations")}
                        placeholder="Specialization (e.g., Cardiology)"
                        className={`${inputClass} col-span-11`}
                      />
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveField(i, "specializations")
                          }
                          className="text-red-400 hover:text-red-300 transition-colors h-10 w-10 flex items-center justify-center bg-white/5 rounded-full disabled:opacity-50"
                          disabled={formData.specializations.length <= 1}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 12H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddField("specializations")}
                    className="px-4 py-2 text-sm bg-white/10 border border-white/20 text-purple-300 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    + Add Specialization
                  </button>
                </div>
              </section>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                </button>
              </div>

              <div className="text-center mt-8">
                <p className="text-gray-300 text-sm">
                  Already have a professional account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-purple-300 hover:text-purple-200 hover:underline"
                  >
                    Sign In Here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSignup;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const EditDoctorProfile = () => {
  const { user } = useAuth();
  const [doctorData, setDoctorData] = useState(null);
  const [formData, setFormData] = useState({
    about: "",
    consultationFee: "",
    languages: "",
    specializations: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`/api/v1/doctor`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const doctor = res.data.data.doctors.find(
          (d) => d.user._id === user._id
        );

        if (!doctor) return;

        setDoctorData(doctor);
        setFormData({
          about: doctor.about || "",
          consultationFee: doctor.consultationFee || "",
          languages: doctor.languages?.join(", ") || "",
          specializations:
            doctor.specializations?.map((s) => s.name).join(", ") || "",
        });
      } catch (err) {
        alert("Failed to load profile");
      }
    };

    if (user) fetchDoctor();
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(
        `/api/v1/doctor/${doctorData._id}`,
        {
          about: formData.about,
          consultationFee: parseInt(formData.consultationFee),
          languages: formData.languages
            .split(",")
            .map((lang) => lang.trim())
            .filter(Boolean),
          specializations: formData.specializations
            .split(",")
            .map((spec) => ({ name: spec.trim(), verified: false }))
            .filter((s) => s.name),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert("Profile updated successfully!");
      navigate("/dashboard");
    } catch (err) {
      alert("Failed to update profile");
      console.log(err.response?.data);
    }
  };

  if (!doctorData) {
    return <div className="text-center py-10 text-lg">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-xl rounded-xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-blue-600">
        Edit Doctor Profile
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">About</label>
          <textarea
            name="about"
            rows={4}
            className="w-full border border-gray-300 p-2 rounded"
            value={formData.about}
            onChange={handleChange}
            placeholder="Write about yourself..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Consultation Fee (₹)</label>
          <input
            type="number"
            name="consultationFee"
            className="w-full border border-gray-300 p-2 rounded"
            value={formData.consultationFee}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Languages (comma separated)</label>
          <input
            type="text"
            name="languages"
            className="w-full border border-gray-300 p-2 rounded"
            value={formData.languages}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Specializations (comma separated)</label>
          <input
            type="text"
            name="specializations"
            className="w-full border border-gray-300 p-2 rounded"
            value={formData.specializations}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditDoctorProfile;

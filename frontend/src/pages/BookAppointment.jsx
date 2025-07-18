import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const BookAppointment = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    doctor: "",
    facility: "",
    date: "",
    startTime: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/doctors");
        setDoctors(res.data.data.doctors);
      } catch (err) {
        console.error("Failed to fetch doctors:", err);
        setError("Could not load the list of doctors.");
      }
    };
    fetchDoctors();
  }, []);

  const selectedDoctor = doctors.find((d) => d._id === formData.doctor);

  useEffect(() => {
    // Reset slots if doctor or date changes
    setAvailableSlots([]);
    setFormData((prev) => ({ ...prev, startTime: "" }));

    if (formData.doctor && formData.date && formData.facility) {
      const fetchSlots = async () => {
        try {
          const facilityData = JSON.parse(formData.facility);
          const res = await api.get("/appointments/available-slots", {
            params: {
              doctorId: formData.doctor,
              date: formData.date,
              facilityId: facilityData.id,
            },
          });
          setAvailableSlots(res.data.data.availableSlots);
        } catch (err) {
          console.error("Failed to fetch slots:", err);
          setAvailableSlots([]);
        }
      };
      fetchSlots();
    }
  }, [formData.doctor, formData.date, formData.facility]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset dependent fields when a primary one changes
    if (name === "doctor") {
      setFormData((prev) => ({
        ...prev,
        doctor: value,
        facility: "",
        date: "",
        startTime: "",
      }));
    } else if (name === "facility") {
      setFormData((prev) => ({
        ...prev,
        facility: value,
        date: "",
        startTime: "",
      }));
    } else if (name === "date") {
      setFormData((prev) => ({ ...prev, date: value, startTime: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        type: "consultation", // Hardcoded for this form
        facility: JSON.parse(formData.facility),
      };
      await api.post("/appointments", payload);
      alert("Appointment booked successfully!");
      navigate("/my-appointments");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Book an Appointment
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Doctor</label>
          <select
            name="doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select a Doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.user.name} - {doc.specializations[0]?.name}
              </option>
            ))}
          </select>
        </div>

        {selectedDoctor && (
          <div>
            <label className="block font-medium">Facility</label>
            <select
              name="facility"
              value={formData.facility}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a Facility</option>
              {selectedDoctor.facilities
                .filter((f) => f.isActive)
                .map((fac, idx) => (
                  <option
                    key={idx}
                    value={JSON.stringify({ type: fac.type, id: fac.id._id })}
                  >
                    {fac.id.name} ({fac.type})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input"
            required
            disabled={!formData.facility}
          />
        </div>

        <div>
          <label className="block font-medium">Available Time Slot</label>
          <select
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="input"
            required
            disabled={!formData.date || availableSlots.length === 0}
          >
            <option value="">
              {availableSlots.length > 0
                ? "Select a Time"
                : "No slots available"}
            </option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Reason for Visit</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="input"
            rows="3"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
};

export default BookAppointment;

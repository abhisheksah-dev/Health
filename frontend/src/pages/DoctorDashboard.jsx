import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DoctorDashboard = () => {
  const { user } = useAuth(); // The full user object with doctorProfile is here
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.doctorProfile) {
      setDoctor(user.doctorProfile);
      setLoading(false);
    } else {
      // Fallback if doctorProfile isn't on the user object for some reason
      const fetchDoctorProfile = async () => {
        try {
          const res = await api.get(`/doctors/${user.doctorProfile._id}`);
          setDoctor(res.data.data.doctor);
        } catch (err) {
          setError("Failed to load doctor data.");
        } finally {
          setLoading(false);
        }
      };
      fetchDoctorProfile();
    }
  }, [user]);

  if (loading)
    return (
      <p className="text-center mt-10 text-blue-500">Loading dashboard...</p>
    );
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!doctor)
    return (
      <p className="text-center mt-10 text-gray-500">
        No doctor profile found.
      </p>
    );

  const dayMap = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">👨‍⚕️ Doctor Dashboard</h1>

      {/* Profile Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Profile Info</h2>
          <p>
            <strong>Name:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Registration No:</strong> {doctor.registrationNumber}
          </p>
          <p>
            <strong>Specializations:</strong>{" "}
            {doctor.specializations?.map((s) => s.name).join(", ")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Experience & Fee</h2>
          <p>
            <strong>Experience:</strong> {doctor.experienceYears || 0} years
          </p>
          <p>
            <strong>Consultation Fee:</strong> ₹{doctor.consultationFee}
          </p>
          <p>
            <strong>Languages:</strong> {doctor.languages?.join(", ")}
          </p>
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">🎓 Qualifications</h2>
        <ul className="space-y-3">
          {doctor.qualifications?.map((q, i) => (
            <li key={i} className="border-b pb-2">
              <p>
                <strong>Degree:</strong> {q.degree}
              </p>
              <p>
                <strong>Institution:</strong> {q.institution} ({q.year})
              </p>
              <p>
                <strong>Country:</strong> {q.country}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">🗓️ Weekly Schedule</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Day</th>
                <th className="p-3 border">Start</th>
                <th className="p-3 border">End</th>
                <th className="p-3 border">Slot (min)</th>
                <th className="p-3 border">Facility Type</th>
                <th className="p-3 border">Active?</th>
              </tr>
            </thead>
            <tbody>
              {doctor.schedule?.length > 0 ? (
                doctor.schedule.map((s, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 border">{dayMap[s.dayOfWeek]}</td>
                    <td className="p-3 border">{s.startTime}</td>
                    <td className="p-3 border">{s.endTime}</td>
                    <td className="p-3 border">{s.slotDuration}</td>
                    <td className="p-3 border capitalize">
                      {s.facility?.type}
                    </td>
                    <td className="p-3 border">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          s.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {s.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No schedule found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

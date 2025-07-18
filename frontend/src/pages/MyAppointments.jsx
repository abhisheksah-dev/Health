import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/appointments/my-appointments");
        setAppointments(res.data.data.appointments);
      } catch (err) {
        setError("Failed to fetch appointments.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const cancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?"))
      return;
    try {
      await api.patch(`/appointments/${id}/cancel`, {
        reason: "Cancelled by user",
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === id ? { ...apt, status: "cancelled" } : apt
        )
      );
      alert("Appointment cancelled successfully.");
    } catch (err) {
      alert("Failed to cancel appointment.");
    }
  };

  if (loading)
    return <div className="text-center p-10">Loading appointments...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Appointments</h1>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Date & Time</th>
                <th className="p-4 text-left">
                  {user.role === "doctor" ? "Patient" : "Doctor"}
                </th>
                <th className="p-4 text-left">Facility</th>
                <th className="p-4 text-left">Reason</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-500">
                    No appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {new Date(apt.date).toLocaleDateString()} at{" "}
                      {apt.startTime}
                    </td>
                    <td className="p-4">
                      {user.role === "doctor"
                        ? apt.patient.name
                        : apt.doctor.user.name}
                    </td>
                    <td className="p-4">{apt.facility.id?.name || "N/A"}</td>
                    <td className="p-4 truncate max-w-xs">{apt.reason}</td>
                    <td className="p-4 capitalize">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          apt.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : apt.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : apt.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {apt.status === "pending" ||
                      apt.status === "confirmed" ? (
                        <button
                          onClick={() => cancelAppointment(apt._id)}
                          className="text-red-500 hover:underline"
                        >
                          Cancel
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;

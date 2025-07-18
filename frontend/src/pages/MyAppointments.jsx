import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReviewModal from "../components/ReviewModal"; // Import the modal

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingAppointment, setReviewingAppointment] = useState(null); // State for modal

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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleReviewSubmit = (appointmentId) => {
    // Refresh the appointments list to show that a review has been submitted
    fetchAppointments();
  };

  if (loading)
    return <div className="text-center p-10">Loading appointments...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <>
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
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-6 text-gray-500">
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
                      <td className="p-4 capitalize">{/* Status span */}</td>
                      <td className="p-4">
                        {user.role === "patient" &&
                          apt.status === "completed" &&
                          !apt.review && (
                            <button
                              onClick={() => setReviewingAppointment(apt)}
                              className="text-green-600 hover:underline"
                            >
                              Leave a Review
                            </button>
                          )}
                        {user.role === "patient" &&
                          apt.status === "completed" &&
                          apt.review && (
                            <span className="text-gray-400">Reviewed</span>
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
      {reviewingAppointment && (
        <ReviewModal
          appointment={reviewingAppointment}
          onClose={() => setReviewingAppointment(null)}
          onReviewSubmit={handleReviewSubmit}
        />
      )}
    </>
  );
};

export default MyAppointments;

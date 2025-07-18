import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // This endpoint now fetches both stats and appointments
        const res = await api.get("/doctors/dashboard-stats");
        setData(res.data.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-10 text-blue-500">Loading dashboard...</p>
    );
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!data)
    return (
      <p className="text-center mt-10 text-gray-500">Could not load data.</p>
    );

  const { stats, upcomingAppointments } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        👨‍⚕️ Welcome, Dr. {user.name.split(" ").pop()}
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <p className="text-4xl font-bold text-blue-600">
            {stats.totalAppointments || 0}
          </p>
          <p className="text-gray-500">Total Appointments</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-green-600">
            {stats.statusCounts?.completed || 0}
          </p>
          <p className="text-gray-500">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-bold text-yellow-600">
            {stats.statusCounts?.pending || 0}
          </p>
          <p className="text-gray-500">Pending</p>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => (
              <div
                key={apt._id}
                className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p>
                    <strong>{apt.patient.name}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(apt.date).toDateString()} at {apt.startTime}
                  </p>
                </div>
                <Link
                  to={`/my-appointments`}
                  className="text-blue-500 hover:underline"
                >
                  View Details
                </Link>
              </div>
            ))
          ) : (
            <p>No upcoming appointments.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

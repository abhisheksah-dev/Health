import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, recordsRes] = await Promise.all([
          api.get("/appointments/my-appointments?limit=3&sort=date"),
          api.get("/health-records?limit=3&sort=-date"),
        ]);
        setAppointments(apptRes.data.data.appointments);
        setRecords(recordsRes.data.data.records);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return <div className="text-center p-10">Loading your dashboard...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}!</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
          <div className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <div key={apt._id} className="p-3 bg-blue-50 rounded-lg">
                  <p>
                    With <strong>{apt.doctor.user.name}</strong> on{" "}
                    {new Date(apt.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">{apt.reason}</p>
                </div>
              ))
            ) : (
              <p>No upcoming appointments.</p>
            )}
          </div>
          <Link
            to="/my-appointments"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            View All
          </Link>
        </div>

        {/* Recent Health Records */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recent Health Records</h2>
          <div className="space-y-3">
            {records.length > 0 ? (
              records.map((rec) => (
                <div key={rec._id} className="p-3 bg-green-50 rounded-lg">
                  <p className="font-semibold capitalize">{rec.type} Record</p>
                  <p className="text-sm text-gray-600">
                    On {new Date(rec.date).toLocaleDateString()}:{" "}
                    {rec.diagnosis}
                  </p>
                </div>
              ))
            ) : (
              <p>No health records yet.</p>
            )}
          </div>
          <Link
            to="/health-records"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            View All
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

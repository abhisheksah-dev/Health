import React, { useState, useEffect } from "react";
import api from "../services/api";

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get("/health-records");
        setRecords(res.data.data.records);
      } catch (err) {
        setError("Failed to fetch health records.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading)
    return <div className="text-center p-10">Loading health records...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Health Records</h1>
      {records.length === 0 ? (
        <p className="text-center p-6 text-gray-500 bg-white rounded-lg shadow">
          No health records found.
        </p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record._id} className="bg-white p-4 shadow rounded-lg">
              <h2 className="text-xl font-semibold capitalize">
                {record.type} Record
              </h2>
              <p className="text-sm text-gray-500">
                Date: {new Date(record.date).toLocaleDateString()}
              </p>
              <p className="mt-2">
                <strong>Diagnosis:</strong> {record.diagnosis}
              </p>
              {record.notes && (
                <p className="mt-1">
                  <strong>Notes:</strong> {record.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;

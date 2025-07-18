import React from "react";

export default function PatientPage() {
  const patient = {
    name: "Abhishek Kumar",
    age: 22,
    gender: "Male",
    bloodGroup: "O+",
    conditions: ["Hypertension", "Allergy - Dust"],
    appointments: [
      { date: "2025-07-20", doctor: "Dr. Sharma", status: "Confirmed" },
      { date: "2025-08-05", doctor: "Dr. Renu", status: "Pending" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">
          Patient Dashboard
        </h1>

        {/* Personal Info */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Personal Information
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-2 text-gray-600">
            <div>
              <strong>Name:</strong> {patient.name}
            </div>
            <div>
              <strong>Age:</strong> {patient.age}
            </div>
            <div>
              <strong>Gender:</strong> {patient.gender}
            </div>
            <div>
              <strong>Blood Group:</strong> {patient.bloodGroup}
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Medical Conditions
          </h2>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {patient.conditions.map((condition, idx) => (
              <li key={idx}>{condition}</li>
            ))}
          </ul>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700">
            Upcoming Appointments
          </h2>
          <table className="w-full mt-2 text-left text-gray-600">
            <thead>
              <tr className="bg-blue-100">
                <th className="p-2">Date</th>
                <th className="p-2">Doctor</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.appointments.map((appt, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{appt.date}</td>
                  <td className="p-2">{appt.doctor}</td>
                  <td className="p-2">{appt.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

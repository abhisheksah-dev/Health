import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
//import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DoctorProfile = () => {
  const { user, token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const res = await api.get(`/doctors/${user?.doctorId}`);
        setDoctor(res.data.data.doctor);
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.doctorId) {
      fetchDoctorProfile();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center py-10">Loading doctor profile...</div>;
  }

  if (!doctor) {
    return (
      <div className="text-center text-red-600 py-10">
        Doctor profile not found.
      </div>
    );
  }

  const {
    user: userDetails,
    specializations,
    qualifications,
    experience,
    schedule,
    consultationFee,
    currency,
    languages,
    about,
    services,
    facilities,
  } = doctor;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Doctor Profile</h1>
        <button
          onClick={() => navigate('/edit-doctor-profile')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Edit Profile
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <strong>Name:</strong> {userDetails?.name}
        </div>
        <div>
          <strong>Email:</strong> {userDetails?.email}
        </div>
        <div>
          <strong>Phone:</strong> {userDetails?.phone}
        </div>
        <div>
          <strong>Specializations:</strong> {specializations?.join(', ')}
        </div>
        <div>
          <strong>Qualifications:</strong> {qualifications?.join(', ')}
        </div>
        <div>
          <strong>Experience:</strong> {experience} years
        </div>
        <div>
          <strong>Consultation Fee:</strong> {currency} {consultationFee}
        </div>
        <div>
          <strong>Languages:</strong> {languages?.join(', ')}
        </div>
        <div>
          <strong>Services:</strong> {services?.join(', ')}
        </div>
        <div>
          <strong>About:</strong> {about}
        </div>
        <div>
          <strong>Facilities:</strong>
          <ul className="list-disc list-inside">
            {facilities?.map((f, idx) => (
              <li key={idx}>
                {f.type.toUpperCase()} — {f.id?.name || 'Unnamed'} ({f.isActive ? 'Active' : 'Inactive'})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;

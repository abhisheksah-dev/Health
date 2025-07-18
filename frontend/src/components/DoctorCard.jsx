import React from 'react';
import { Link } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-blue-600">{doctor.user.name}</h3>
        <p className="text-gray-600">{doctor.specializations.map(s => s.name).join(', ')}</p>
        <p className="text-sm text-gray-500 mt-2">{doctor.experienceYears || 0} years of experience</p>
        <p className="text-lg font-semibold text-green-600 mt-2">₹{doctor.consultationFee}</p>
      </div>
      <Link
        to={`/book-appointment/${doctor._id}`}
        className="mt-4 w-full bg-blue-600 text-white text-center font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Book Appointment
      </Link>
    </div>
  );
};

export default DoctorCard;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const DoctorCard = ({ doctor }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
    <div>
      <h3 className="text-xl font-bold text-blue-600">{doctor.user.name}</h3>
      <p className="text-gray-600">{doctor.specializations.map(s => s.name).join(', ')}</p>
      <p className="text-sm text-gray-500 mt-2">{doctor.experienceYears || 0} years of experience</p>
      <p className="text-lg font-semibold text-green-600 mt-2">₹{doctor.consultationFee}</p>
    </div>
    <Link
      to={`/doctors/${doctor._id}`}
      className="mt-4 w-full bg-blue-600 text-white text-center font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
    >
      View Profile
    </Link>
  </div>
);

const FindDoctor = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [specialization, setSpecialization] = useState('');

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (specialization) params.specialization = specialization;

            const res = await api.get('/doctors', { params });
            setDoctors(res.data.data.doctors);
        } catch (err) {
            setError('Failed to fetch doctors. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDoctors();
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Find Your Doctor</h1>
            
            {/* Filter and Search Bar */}
            <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col md:flex-row gap-4">
                <input 
                    type="text"
                    placeholder="Search by doctor's name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input flex-grow"
                />
                <input 
                    type="text"
                    placeholder="Filter by specialization..."
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="input flex-grow"
                />
                <button type="submit" className="btn-primary">Search</button>
            </form>

            {loading && <div className="text-center p-10">Loading doctors...</div>}
            {error && <div className="text-center p-10 text-red-500">{error}</div>}
            
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {doctors.length > 0 ? (
                        doctors.map(doctor => <DoctorCard key={doctor._id} doctor={doctor} />)
                    ) : (
                        <p className="text-center col-span-full">No doctors found matching your criteria.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FindDoctor;
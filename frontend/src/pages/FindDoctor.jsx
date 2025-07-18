import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DoctorCard from '../components/DoctorCard';

const FindDoctor = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/doctors');
                setDoctors(res.data.data.doctors);
            } catch (err) {
                setError('Failed to fetch doctors. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    if (loading) return <div className="text-center p-10">Loading doctors...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Find Your Doctor</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.map(doctor => (
                    <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
            </div>
        </div>
    );
};

export default FindDoctor;
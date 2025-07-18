import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const DoctorDetails = () => {
    const { doctorId } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [doctorRes, reviewsRes] = await Promise.all([
                    api.get(`/doctors/${doctorId}`),
                    api.get(`/reviews/entity/doctor/${doctorId}`)
                ]);
                setDoctor(doctorRes.data.data.doctor);
                setReviews(reviewsRes.data.data.reviews);
            } catch (err) {
                setError('Failed to load doctor details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [doctorId]);

    if (loading) return <div className="text-center p-10">Loading profile...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    if (!doctor) return <div className="text-center p-10">Doctor not found.</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column */}
                    <div className="flex-shrink-0 text-center">
                         <img src={doctor.user.avatar || 'https://via.placeholder.com/150'} alt={doctor.user.name} className="w-40 h-40 rounded-full mx-auto border-4 border-blue-200" />
                         <h1 className="text-3xl font-bold mt-4">{doctor.user.name}</h1>
                         <p className="text-gray-600 text-lg">{doctor.specializations.map(s => s.name).join(', ')}</p>
                         <Link to={`/book-appointment/${doctor._id}`} className="btn-primary mt-6 inline-block w-full">
                            Book Appointment
                         </Link>
                    </div>
                    {/* Right Column */}
                    <div className="flex-1">
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4">About Dr. {doctor.user.name.split(' ').pop()}</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{doctor.about || "No biography provided."}</p>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Qualifications</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {doctor.qualifications.map((q, i) => <li key={i}>{q.degree}, {q.institution} ({q.year})</li>)}
                                </ul>
                           </div>
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Languages</h3>
                                <p className="text-gray-600">{doctor.languages.join(', ')}</p>
                           </div>
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Experience</h3>
                                <p className="text-gray-600">{doctor.experienceYears || 0} years</p>
                           </div>
                           <div>
                                <h3 className="font-semibold text-lg mb-2">Consultation Fee</h3>
                                <p className="text-gray-600 font-bold">₹{doctor.consultationFee}</p>
                           </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-10">
                    <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Patient Reviews</h2>
                    {reviews.length > 0 ? (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <div key={review._id} className="border p-4 rounded-lg">
                                    <p className="font-semibold">{review.title}</p>
                                    <p className="text-sm text-gray-500">by {review.user.name} - {'⭐'.repeat(review.rating.overall)}</p>
                                    <p className="mt-2 text-gray-700">{review.content}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500">No reviews yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default DoctorDetails;
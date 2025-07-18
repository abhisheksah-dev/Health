import React from 'react';
import { Link } from 'react-router-dom';

const Telemedicine = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 text-center">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">Telemedicine Services</h1>
            <p className="text-lg text-gray-700 mb-6">
                Consult with top specialists from the comfort and privacy of your home. Our secure video consultation platform connects you with the care you need, when you need it.
            </p>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
                <ol className="text-left space-y-4">
                    <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">1.</span> Find a doctor that fits your needs from our extensive network.</li>
                    <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">2.</span> Book an available time slot that works for your schedule.</li>
                    <li className="flex items-start"><span className="font-bold text-blue-600 mr-2">3.</span> Receive a secure video link for your consultation. It's that simple!</li>
                </ol>
                <Link to="/doctors" className="btn-primary mt-8 inline-block">
                    Find a Doctor Now
                </Link>
            </div>
        </div>
    );
};

export default Telemedicine;
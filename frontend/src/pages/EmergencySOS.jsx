import React, { useState } from 'react';

const EmergencySOS = () => {
    const [alertSent, setAlertSent] = useState(false);

    const handleSOS = () => {
        if (window.confirm("Are you sure you want to send an emergency alert to your contacts and nearby services?")) {
            // In a real app, this would make an API call:
            // await api.post('/emergency-sos', { location: ... });
            setAlertSent(true);
            setTimeout(() => setAlertSent(false), 5000); // Reset after 5 seconds
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Emergency SOS</h1>
            <p className="text-gray-700 mb-8">
                In case of a medical emergency, press the button below. An alert with your location will be sent to your emergency contacts.
            </p>
            <div className="flex justify-center items-center">
                <button
                    onClick={handleSOS}
                    className="w-48 h-48 bg-red-500 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg transform transition-transform hover:scale-110 active:scale-95 animate-pulse"
                >
                    SOS
                </button>
            </div>
            {alertSent && (
                <p className="mt-8 text-green-600 font-semibold bg-green-100 p-3 rounded-lg">
                    Emergency alert has been sent! Help is on the way.
                </p>
            )}
        </div>
    );
};

export default EmergencySOS;
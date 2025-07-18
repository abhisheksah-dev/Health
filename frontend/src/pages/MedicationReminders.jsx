import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MedicationReminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newReminder, setNewReminder] = useState({
        medicationName: '',
        dosage: '',
        frequency: { type: 'daily', times: ['09:00'] },
        startDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchReminders = async () => {
            try {
                const res = await api.get('/medication-reminders');
                setReminders(res.data.data.reminders);
            } catch (err) {
                setError('Could not fetch reminders.');
            } finally {
                setLoading(false);
            }
        };
        fetchReminders();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'time') {
            setNewReminder(prev => ({ ...prev, frequency: { ...prev.frequency, times: [value] } }));
        } else {
            setNewReminder(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/medication-reminders', newReminder);
            setReminders(prev => [...prev, res.data.data.reminder]);
            setShowForm(false);
            setNewReminder({ medicationName: '', dosage: '', frequency: { type: 'daily', times: ['09:00'] }, startDate: new Date().toISOString().split('T')[0] });
        } catch (err) {
            alert('Failed to add reminder.');
        }
    };

    if (loading) return <div className="text-center p-10">Loading reminders...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Medication Reminders</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    {showForm ? 'Cancel' : '+ Add Reminder'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
                    <h2 className="text-xl font-semibold">New Reminder</h2>
                    <input name="medicationName" value={newReminder.medicationName} onChange={handleChange} placeholder="Medication Name" className="input" required />
                    <input name="dosage" value={newReminder.dosage} onChange={handleChange} placeholder="Dosage (e.g., 1 pill)" className="input" required />
                    <input name="time" type="time" value={newReminder.frequency.times[0]} onChange={handleChange} className="input" required />
                    <button type="submit" className="btn-primary w-full">Save Reminder</button>
                </form>
            )}

            <div className="space-y-4">
                {reminders.length === 0 ? (
                    <p className="text-center text-gray-500 card">You have no active reminders.</p>
                ) : (
                    reminders.map(r => (
                        <div key={r._id} className="card flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg">{r.medicationName}</p>
                                <p className="text-gray-600">{r.dosage}</p>
                            </div>
                            <p className="font-semibold text-blue-600">{r.frequency.times.join(', ')}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MedicationReminders;
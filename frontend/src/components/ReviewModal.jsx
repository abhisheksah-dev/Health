import React, { useState } from 'react';
import api from '../services/api';

const ReviewModal = ({ appointment, onClose, onReviewSubmit }) => {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        appointmentId: appointment._id,
        rating: { overall: rating }, // Simplified rating for now
        title,
        content,
      };
      await api.post('/reviews', payload);
      onReviewSubmit(appointment._id); // Notify parent component
      onClose(); // Close modal on success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
        <p className="mb-4">For your appointment with <strong>{appointment.doctor.user.name}</strong> on {new Date(appointment.date).toLocaleDateString()}</p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Overall Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input">
              {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 && 's'}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-medium">Review Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g., Great experience!" required />
          </div>
          <div>
            <label className="block font-medium">Your Review</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="input" rows="4" placeholder="Share your experience..." required />
          </div>
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="text-gray-600">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
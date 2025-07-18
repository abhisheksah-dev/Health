import React, { useState } from 'react';

const SymptomChecker = () => {
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);

        // This is a placeholder for the actual API call.
        setTimeout(() => {
            setResult({
                message: "Based on the symptoms described, potential considerations include a common viral infection or seasonal allergies. However, this is not a diagnosis.",
                disclaimer: "Our AI analysis is for informational purposes only and is not a substitute for professional medical advice. Please consult a doctor for an accurate diagnosis."
            });
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-4">AI Symptom Checker</h1>
            <p className="text-center text-gray-600 mb-6">Describe your symptoms to get preliminary insights. This tool does not provide medical advice.</p>
            
            <div className="card">
                <form onSubmit={handleSubmit}>
                    <label htmlFor="symptoms" className="block font-medium mb-2">Describe your symptoms</label>
                    <textarea
                        id="symptoms"
                        rows="5"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="input"
                        placeholder="e.g., I have a sore throat, a runny nose, and have been coughing for 3 days..."
                        required
                    />
                    <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                        {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                    </button>
                </form>
            </div>

            {result && (
                <div className="card mt-6">
                    <h2 className="text-xl font-semibold mb-2">Analysis Result</h2>
                    <p className="text-gray-700">{result.message}</p>
                    <p className="mt-4 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-lg">{result.disclaimer}</p>
                </div>
            )}
        </div>
    );
};

export default SymptomChecker;
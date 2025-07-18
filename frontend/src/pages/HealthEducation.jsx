import React, { useState, useEffect } from 'react';
import api from '../services/api';

const HealthEducation = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await api.get('/health-education');
                setArticles(res.data.data.content);
            } catch (err) {
                setError('Failed to fetch articles.');
            } finally {
                setLoading(false);
            }
        };
        fetchArticles();
    }, []);

    if (loading) return <div className="text-center p-10">Loading articles...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
    
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">Health & Wellness Articles</h1>
            <div className="space-y-6">
                {articles.map(article => (
                    <div key={article._id} className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-blue-600">{article.title}</h2>
                        <p className="text-sm text-gray-500 mb-2">By {article.author.name} | Category: {article.category}</p>
                        <p className="text-gray-700">{article.summary}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HealthEducation;
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section
        className="relative bg-gradient-to-r from-blue-500 to-green-400 text-white flex items-center justify-center text-center"
        style={{ height: "calc(100vh - 5rem)" }} // Adjusted height for navbar
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 p-6">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
            Your Health, Reimagined.
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8">
            Seamlessly connect with doctors, manage your health records, and
            take control of your well-being with our integrated platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/signup"
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition-transform transform hover:scale-105"
            >
              Get Started
            </Link>
            <Link
              to="/signup-doctor"
              className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-blue-600 transition-all"
            >
              I'm a Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            A Complete Healthcare Ecosystem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* UPDATED: FeatureCards are now links */}
            <FeatureCard
              to="/doctors"
              title="Book Appointments"
              description="Find top-rated doctors and book your appointments instantly."
            />
            <FeatureCard
              to="/telemedicine"
              title="Telemedicine"
              description="Consult with specialists from the comfort of your home via secure video calls."
            />
            <FeatureCard
              to="/health-records"
              title="Health Records"
              description="Access and manage all your medical records in one secure, centralized location."
            />
            <FeatureCard
              to="/symptom-checker"
              title="AI Symptom Checker"
              description="Get preliminary insights into your symptoms with our intelligent analysis tool."
            />
            <FeatureCard
              to="/emergency-sos"
              title="Emergency SOS"
              description="Alert your loved ones and nearby emergency services with a single tap."
            />
            <FeatureCard
              to="/medication-reminders"
              title="Medication Reminders"
              description="Never miss a dose with our smart medication scheduling and reminder system."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

// UPDATED: FeatureCard component now accepts a 'to' prop for navigation
const FeatureCard = ({ to, title, description }) => (
  <Link to={to} className="block group">
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 h-full">
      <h3 className="text-xl font-semibold text-blue-600 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

export default Home;
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // ✅ ADD THIS

const Home = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, observerOptions);

    document.querySelectorAll('[id^="animate-"]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: "Book Appointments",
      description:
        "Find top-rated doctors and book your appointments instantly.",
      icon: "🎯",
      gradient: "from-purple-500 via-pink-500 to-red-500",
      to: "/doctors",
    },
    {
      title: "Telemedicine",
      description:
        "Consult with specialists from the comfort of your home via secure video calls.",
      icon: "📊",
      gradient: "from-blue-500 via-cyan-500 to-teal-500",
      to: "/telemedicine",
    },
    {
      title: "Health Records",
      description:
        "Access and manage all your medical records in one secure, centralized location.",
      icon: "🔒",
      gradient: "from-green-500 via-emerald-500 to-blue-500",
      to: "/health-records",
    },
    {
      title: "AI Symptom Checker",
      description:
        "Get preliminary insights into your symptoms with our intelligent analysis tool.",
      icon: "🏥",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      to: "/symptom-checker",
    },
    {
      title: "Emergency SOS",
      description:
        "Alert your loved ones and nearby emergency services with a single tap.",
      icon: "💊",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      to: "/emergency-sos",
    },
    {
      title: "Medication Reminders",
      description:
        "Never miss a dose with our smart medication scheduling and reminder system.",
      icon: "🌟",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      to: "/medication-reminders",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Dynamic Mouse Follower */}
      <div
        className="fixed w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full pointer-events-none z-50 opacity-70 blur-sm transition-all duration-300"
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
          transform: "translate(0, 0)",
        }}
      ></div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-6xl mx-auto">
          <div
            id="animate-hero"
            className={`transition-all duration-1000 ${
              isVisible["animate-hero"]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
              Your Health,
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                Reimagined.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Seamlessly connect with doctors, manage your health records, and
              take control of your well-being with our integrated platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/signup"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </Link>

              <Link
                to="/signup-doctor"
                className="group relative px-8 py-4 bg-transparent border-2 border-purple-400 text-purple-300 rounded-2xl font-semibold text-lg hover:bg-purple-400 hover:text-white transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="relative z-10">I'm a Doctor</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div
            id="animate-title"
            className={`text-center mb-16 transition-all duration-1000 delay-300 ${
              isVisible["animate-title"]
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              A Complete Healthcare
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ecosystem
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                to={feature.to}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                gradient={feature.gradient}
                index={index}
                isVisible={isVisible[`animate-card-${index}`]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button className="group relative w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center">
          <span className="text-2xl">💬</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
};

const FeatureCard = ({
  to,
  title,
  description,
  icon,
  gradient,
  index,
  isVisible,
}) => (
  <Link to={to} className="group block h-full w-full text-left">
    <div
      id={`animate-card-${index}`}
      className={`relative h-full p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl border border-white/20 hover:border-purple-400/50 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-3xl`}
      ></div>

      <div className="relative z-10 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center text-3xl transform group-hover:rotate-12 transition-transform duration-300">
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
          {description}
        </p>
      </div>

      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  </Link>
);

export default Home;

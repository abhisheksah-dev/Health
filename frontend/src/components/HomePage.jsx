export default function HomePage() {
  const features = [
    'Virtual Consultant Chatbot', 'Appointment Scheduling',
    'Health Records & Dashboard', 'Symptom Checker',
    'Emergency Service Locator', 'Doctor Reviews & Ratings',
    'Govt. Schemes & NGO Support', 'AI-based Alerts',
    'Donor Network', 'Personalized Health Plans',
    'Real-Time Outbreaks', 'Lab Report Analysis',
    'Prescription Scanner', 'Geofenced Reminders'
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-green-600 text-white py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to HealthApp</h1>
        <p className="text-lg">Your all-in-one platform for better health management</p>
      </header>
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-medium mb-2 text-green-600">{feat}</h3>
              <p className="text-gray-600 text-sm">Learn more about our {feat.toLowerCase()} feature.</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto text-center text-gray-600">© 2025 HealthApp. All rights reserved.</div>
      </footer>
    </div>
  );
}
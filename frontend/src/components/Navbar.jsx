import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-green-600">HealthApp</Link>
        <div className="space-x-4">
          <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-green-600">Login</Link>
          <Link to="/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
}
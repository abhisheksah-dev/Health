import React, { useState } from "react";
import api from "../services/api";

const FindDonors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({
    bloodGroup: "A+",
    city: "",
  });

  const handleChange = (e) => {
    setSearchParams((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDonors([]);
    try {
      const res = await api.get("/blood-donors/search", {
        params: searchParams,
      });
      setDonors(res.data.data.donors);
    } catch (err) {
      setError("Failed to find donors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Find Blood Donors</h1>
      <form
        onSubmit={handleSearch}
        className="bg-white p-6 rounded-lg shadow-md mb-6 flex gap-4 items-end"
      >
        <div>
          <label className="block font-medium">Blood Group</label>
          <select
            name="bloodGroup"
            value={searchParams.bloodGroup}
            onChange={handleChange}
            className="input"
          >
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">City</label>
          <input
            name="city"
            value={searchParams.city}
            onChange={handleChange}
            placeholder="e.g., New Delhi"
            className="input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-red-500 text-white py-2 px-6 rounded-lg hover:bg-red-600 disabled:bg-red-300"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="space-y-4">
        {donors.length > 0 ? (
          donors.map((donor) => (
            <div
              key={donor._id}
              className="bg-white p-4 shadow rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{donor.user.name}</p>
                <p className="text-sm text-gray-600">
                  Blood Group:{" "}
                  <span className="font-bold text-red-600">
                    {donor.bloodGroup}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Location: {donor.location.city}
                </p>
              </div>
              <a
                href={`tel:${donor.user.phone}`}
                className="text-blue-500 hover:underline"
              >
                Contact
              </a>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">
            {!loading && "No donors found for the selected criteria."}
          </p>
        )}
      </div>
    </div>
  );
};

export default FindDonors;

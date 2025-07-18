import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ManageSchedule = () => {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState("");
  const [schedules, setSchedules] = useState([]);

  const [form, setForm] = useState({
    dayOfWeek: 0,
    startTime: "",
    endTime: "",
    slotDuration: 15,
    breakStart: "",
    breakEnd: "",
    facilityType: "clinic",
    facilityId: ""
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get("/api/v1/doctor", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const myDoctor = res.data.data.doctors.find((d) => d.user._id === user._id);
        setSchedules(myDoctor.schedule || []);
        setDoctorId(myDoctor._id);
        if (myDoctor.facilities.length > 0) {
          setForm((f) => ({
            ...f,
            facilityType: myDoctor.facilities[0].type,
            facilityId: myDoctor.facilities[0].id,
          }));
        }
      } catch (err) {
        alert("Failed to load schedule.");
        console.log(err);
      }
    };
    fetchDoctor();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    const newSlot = {
      dayOfWeek: parseInt(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      slotDuration: parseInt(form.slotDuration),
      breakStart: form.breakStart || undefined,
      breakEnd: form.breakEnd || undefined,
      facility: {
        type: form.facilityType,
        id: form.facilityId,
      },
    };
    setSchedules((prev) => [...prev, newSlot]);
  };

  const handleSave = async () => {
    try {
      await axios.patch(
        `/api/v1/doctor/${doctorId}/schedule`,
        { schedule: schedules },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("Schedule updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update schedule");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-white shadow-md p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Manage Schedule</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          Day:
          <select name="dayOfWeek" onChange={handleChange} value={form.dayOfWeek} className="w-full border p-2 mt-1">
            {days.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          Start Time:
          <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className="w-full border p-2 mt-1" />
        </label>

        <label>
          End Time:
          <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className="w-full border p-2 mt-1" />
        </label>

        <label>
          Slot Duration (min):
          <input name="slotDuration" type="number" value={form.slotDuration} onChange={handleChange} className="w-full border p-2 mt-1" />
        </label>

        <label>
          Break Start (optional):
          <input name="breakStart" type="time" value={form.breakStart} onChange={handleChange} className="w-full border p-2 mt-1" />
        </label>

        <label>
          Break End (optional):
          <input name="breakEnd" type="time" value={form.breakEnd} onChange={handleChange} className="w-full border p-2 mt-1" />
        </label>
      </div>

      <button onClick={handleAddSlot} className="mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
        ➕ Add Slot
      </button>

      <h3 className="text-xl font-semibold mt-6 mb-2">Current Slots:</h3>
      {schedules.length === 0 ? (
        <p>No slots added yet.</p>
      ) : (
        <ul className="list-disc ml-6">
          {schedules.map((s, i) => (
            <li key={i}>
              {days[s.dayOfWeek]} — {s.startTime} to {s.endTime} ({s.slotDuration} mins)
            </li>
          ))}
        </ul>
      )}

      <button onClick={handleSave} className="mt-6 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700">
        💾 Save Schedule
      </button>
    </div>
  );
};

export default ManageSchedule;

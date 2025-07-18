import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import DoctorRoute from "./components/DoctorRoute";

// Page Imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DoctorSignup from "./pages/DoctorSignup";
import ForgotPassword from "./pages/ForgetPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import EditDoctorProfile from "./pages/EditDoctorProfile";
import DoctorProfile from "./pages/DoctorProfile";
import ManageSchedule from "./pages/ManageSchedule";
import FindDoctor from "./pages/FindDoctor";
import DoctorDetails from "./pages/DoctorDetails";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import HealthRecords from "./pages/HealthRecords";
import HealthEducation from "./pages/HealthEducation";
import FindDonors from "./pages/FindDonors";
import Telemedicine from "./pages/Telemedicine";
import SymptomChecker from "./pages/SymptomChecker";
import EmergencySOS from "./pages/EmergencySOS";
import MedicationReminders from "./pages/MedicationReminders";

function App() {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-10 bg-blue-500">
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup-doctor" element={<DoctorSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/doctors" element={<FindDoctor />} />
          <Route
            path="/doctors/:doctorId"
            element={
              <ProtectedRoute>
                <DoctorDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/health-education" element={<HealthEducation />} />
          <Route path="/find-donors" element={<FindDonors />} />
          <Route path="/telemedicine" element={<Telemedicine />} />

          {/* --- Patient Protected Routes --- */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-appointment/:doctorId"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <ProtectedRoute>
                <MyAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-records"
            element={
              <ProtectedRoute>
                <HealthRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptom-checker"
            element={
              <ProtectedRoute>
                <SymptomChecker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-sos"
            element={
              <ProtectedRoute>
                <EmergencySOS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medication-reminders"
            element={
              <ProtectedRoute>
                <MedicationReminders />
              </ProtectedRoute>
            }
          />

          {/* --- Doctor Protected Routes --- */}
          <Route
            path="/doctor-dashboard"
            element={
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            }
          />
          <Route
            path="/doctor-profile"
            element={
              <DoctorRoute>
                <DoctorProfile />
              </DoctorRoute>
            }
          />
          <Route
            path="/edit-doctor-profile"
            element={
              <DoctorRoute>
                <EditDoctorProfile />
              </DoctorRoute>
            }
          />
          <Route
            path="/manage-schedule"
            element={
              <DoctorRoute>
                <ManageSchedule />
              </DoctorRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;

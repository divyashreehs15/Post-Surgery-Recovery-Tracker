import React, { useState, Suspense, lazy } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AdminLogin } from "./components/AdminLogin"; // ✅ added import

// ✅ Lazy load all major screens
const PatientDashboard = lazy(() =>
  import("./components/PatientDashboard").then((module) => ({
    default: module.PatientDashboard,
  }))
);
const DailyLogForm = lazy(() =>
  import("./components/DailyLogForm").then((module) => ({
    default: module.DailyLogForm,
  }))
);
const ReportsScreen = lazy(() =>
  import("./components/ReportsScreen").then((module) => ({
    default: module.ReportsScreen,
  }))
);
const DoctorDashboard = lazy(() =>
  import("./components/DoctorDashboard").then((module) => ({
    default: module.DoctorDashboard,
  }))
);
const NotificationsScreen = lazy(() =>
  import("./components/NotificationsScreen").then((module) => ({
    default: module.NotificationsScreen,
  }))
);
const PatientProfile = lazy(() =>
  import("./components/PatientProfile").then((module) => ({
    default: module.PatientProfile,
  }))
);
const MedicationManager = lazy(() =>
  import("./components/MedicationManager").then((module) => ({
    default: module.MedicationManager,
  }))
);
const AppointmentManager = lazy(() =>
  import("./components/AppointmentManager").then((module) => ({
    default: module.AppointmentManager,
  }))
);
const AdminPanel = lazy(() =>
  import("./components/admin/AdminPanel").then((module) => ({
    default: module.AdminPanel,
  }))
);

// ✅ Loading Spinner UI
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-green-50/50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// ✅ App content separated so Router works cleanly
function AppContent() {
const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState("login");
  const [userRole, setUserRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [loading, setLoading] = useState(true); // ✅ loading state
  const location = useLocation();

  // ✅ Load user info from localStorage when the app mounts
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");

    if (token && savedUser && savedRole) {
      setCurrentUser(JSON.parse(savedUser));
      setUserRole(savedRole as "patient" | "doctor" | "admin");
      setCurrentScreen(
        savedRole === "patient"
          ? "patient-dashboard"
          : savedRole === "doctor"
          ? "doctor-dashboard"
          : "admin-panel"
      );
    }

    setLoading(false);
  }, []);

  // ✅ Save session to localStorage on login
  const login = (userData: any, role: "patient" | "doctor" | "admin") => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", role);
    setCurrentUser(userData);
    setUserRole(role);
    if (role === "patient") setCurrentScreen("patient-dashboard");
    else if (role === "doctor") setCurrentScreen("doctor-dashboard");
    else if (role === "admin") setCurrentScreen("admin-panel");
  };

  // ✅ Clear storage on logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setCurrentUser(null);
    setCurrentScreen("login");
  };

  const navigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  // ✅ Show loading spinner while restoring session
  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ If route is /admin, show admin login directly
  if (location.pathname === "/admin") {
    return <AdminLogin />;
  }

  if (!currentUser && currentScreen === "login") {
    return <LoginScreen onLogin={login} />;
  }

  const commonProps = { user: currentUser, onNavigate: navigate, onLogout: logout };

  const renderScreen = () => {
    switch (currentScreen) {
      case "patient-dashboard":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PatientDashboard {...commonProps} />
          </Suspense>
        );
      case "daily-log":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DailyLogForm {...commonProps} />
          </Suspense>
        );
      case "reports":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ReportsScreen {...commonProps} />
          </Suspense>
        );
      case "notifications":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <NotificationsScreen {...commonProps} />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <PatientProfile {...commonProps} />
          </Suspense>
        );
      case "medications":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <MedicationManager {...commonProps} />
          </Suspense>
        );
      case "appointments":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AppointmentManager {...commonProps} />
          </Suspense>
        );
      case "doctor-dashboard":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <DoctorDashboard {...commonProps} />
          </Suspense>
        );
      case "admin-panel":
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminPanel />
          </Suspense>
        );
      default:
        return userRole === "patient" ? (
          <Suspense fallback={<LoadingSpinner />}>
            <PatientDashboard {...commonProps} />
          </Suspense>
        ) : userRole === "doctor" ? (
          <Suspense fallback={<LoadingSpinner />}>
            <DoctorDashboard {...commonProps} />
          </Suspense>
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminPanel />
          </Suspense>
        );
    }
  };

  return <div className="min-h-screen bg-background">{renderScreen()}</div>;
}

// ✅ Wrap main App in Router
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";

import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";

import ClientDashboard from "@/pages/client/dashboard";
import WorkoutsPage from "@/pages/client/workouts";
import ProgressPage from "@/pages/client/progress";
import CoachesPage from "@/pages/client/coaches";
import ClientBookingsPage from "@/pages/client/bookings";

import CoachDashboard from "@/pages/coach/dashboard";
import CoachAvailabilityPage from "@/pages/coach/availability";
import CoachBookingsPage from "@/pages/coach/bookings";
import CoachProfilePage from "@/pages/coach/profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/app"
            element={
              <ProtectedRoute role="client">
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="workouts" element={<WorkoutsPage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="coaches" element={<CoachesPage />} />
            <Route path="bookings" element={<ClientBookingsPage />} />
          </Route>

          <Route
            path="/coach"
            element={
              <ProtectedRoute role="coach">
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<CoachDashboard />} />
            <Route path="availability" element={<CoachAvailabilityPage />} />
            <Route path="bookings" element={<CoachBookingsPage />} />
            <Route path="profile" element={<CoachProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

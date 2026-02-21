import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import {
  ProtectedRoute,
  RoleBasedRoute,
} from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import UsersManagement from "./pages/Admin/UsersManagement";
import Departments from "./pages/Admin/Departments";
import Batches from "./pages/Admin/Batches";r
import Trainers from "./pages/Admin/Trainers";
import TAs from "./pages/Admin/TAs";
import Profile from "./pages/Profile";
import Classrooms from "./pages/Admin/Classrooms";

// Roles that can access the dashboard
const DASHBOARD_ROLES = ["ADMIN", "MANAGER", "TEAM_LEADER", "TRAINER", "TA"];

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes - Accessible by ADMIN, MANAGER, TEAM_LEADER, TRAINER, TA */}
      <Route
        path="/"
        element={
          <RoleBasedRoute allowedRoles={DASHBOARD_ROLES}>
            <MainLayout />
          </RoleBasedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<UsersManagement />} />
        <Route
          path="departments"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <Departments />
            </RoleBasedRoute>
          }
        />
        <Route
          path="batches"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <Batches />
            </RoleBasedRoute>
          }
        />
        <Route
          path="classrooms"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Classrooms />
            </RoleBasedRoute>
          }
        />
        <Route
          path="trainers"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <Trainers />
            </RoleBasedRoute>
          }
        />
        <Route
          path="tas"
          element={
            <RoleBasedRoute allowedRoles={["ADMIN"]}>
              <TAs />
            </RoleBasedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;

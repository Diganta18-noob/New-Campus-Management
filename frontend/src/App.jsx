import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import {
  ProtectedRoute,
  RoleBasedRoute,
} from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/common";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";
import UsersManagement from "./pages/Admin/UsersManagement";
import Departments from "./pages/Admin/Departments";
import Batches from "./pages/Admin/Batches";
import Trainers from "./pages/Admin/Trainers";
import TAs from "./pages/Admin/TAs";
import Profile from "./pages/Profile";
import Classrooms from "./pages/Admin/Classrooms";
import TopicsManagement from "./pages/Admin/TopicsManagement";
import AuditLogs from "./pages/Admin/AuditLogs";
import AttendanceMarking from "./pages/Trainer/AttendanceMarking";
import AttendanceHistory from "./pages/Reports/AttendanceHistory";
import LearnerAttendance from "./pages/Learner/Attendance";
import TrainerDailyUpdates from "./pages/Trainer/DailyUpdates";
import ManagerDailyUpdates from "./pages/Manager/DailyUpdates";
import LearnerPerformance from "./pages/Learner/Performance";

// Roles that can access the dashboard
const DASHBOARD_ROLES = [
  "ADMIN",
  "MANAGER",
  "TEAM_LEADER",
  "TRAINER",
  "TA",
  "LEARNER",
];

function App() {
  return (
    <ErrorBoundary>
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
          <Route path="dashboard" element={<RoleBasedDashboard />} />
          <Route path="students" element={<UsersManagement />} />
          <Route
            path="departments"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <Departments />
              </RoleBasedRoute>
            }
          />
          <Route
            path="batches"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
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
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <Trainers />
              </RoleBasedRoute>
            }
          />
          <Route
            path="tas"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <TAs />
              </RoleBasedRoute>
            }
          />
          <Route path="profile" element={<Profile />} />

          {/* Topics/Courses Routes */}
          <Route
            path="topics"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <TopicsManagement />
              </RoleBasedRoute>
            }
          />

          {/* Audit Logs Route */}
          <Route
            path="audit-logs"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN"]}>
                <AuditLogs />
              </RoleBasedRoute>
            }
          />

          {/* Attendance Routes */}
          <Route
            path="attendance"
            element={
              <RoleBasedRoute allowedRoles={["TRAINER", "TA", "LEARNER"]}>
                <AttendanceMarking />
              </RoleBasedRoute>
            }
          />
          <Route
            path="attendance/mark/:batchId"
            element={
              <RoleBasedRoute allowedRoles={["TRAINER", "TA"]}>
                <AttendanceMarking />
              </RoleBasedRoute>
            }
          />
          <Route
            path="attendance/history"
            element={
              <RoleBasedRoute
                allowedRoles={["TRAINER", "TA", "ADMIN", "MANAGER"]}
              >
                <AttendanceHistory />
              </RoleBasedRoute>
            }
          />
          <Route
            path="my-attendance"
            element={
              <RoleBasedRoute allowedRoles={["LEARNER"]}>
                <LearnerAttendance />
              </RoleBasedRoute>
            }
          />

          {/* Daily Updates Routes */}
          <Route
            path="daily-updates"
            element={
              <RoleBasedRoute allowedRoles={["TRAINER", "TA"]}>
                <TrainerDailyUpdates />
              </RoleBasedRoute>
            }
          />
          <Route
            path="daily-updates/review"
            element={
              <RoleBasedRoute allowedRoles={["MANAGER", "TEAM_LEADER"]}>
                <ManagerDailyUpdates />
              </RoleBasedRoute>
            }
          />
          <Route
            path="performance"
            element={
              <RoleBasedRoute allowedRoles={["LEARNER"]}>
                <LearnerPerformance />
              </RoleBasedRoute>
            }
          />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

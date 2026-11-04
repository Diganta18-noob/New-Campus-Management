import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import {
  ProtectedRoute,
  RoleBasedRoute,
} from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/common";
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const RoleBasedDashboard = lazy(() => import("./pages/RoleBasedDashboard"));
const UsersManagement = lazy(() => import("./pages/Admin/UsersManagement"));
const Departments = lazy(() => import("./pages/Admin/Departments"));
const Batches = lazy(() => import("./pages/Admin/Batches"));
const Trainers = lazy(() => import("./pages/Admin/Trainers"));
const TAs = lazy(() => import("./pages/Admin/TAs"));
const Profile = lazy(() => import("./pages/Profile"));
const Classrooms = lazy(() => import("./pages/Admin/Classrooms"));
const TopicsManagement = lazy(() => import("./pages/Admin/TopicsManagement"));
const AuditLogs = lazy(() => import("./pages/Admin/AuditLogs"));
const AttendanceMarking = lazy(() => import("./pages/Trainer/AttendanceMarking"));
const AttendanceHistory = lazy(() => import("./pages/Reports/AttendanceHistory"));
const Insights = lazy(() => import("./pages/Admin/Insights"));
const LearnerAttendance = lazy(() => import("./pages/Learner/Attendance"));
const TrainerDailyUpdates = lazy(() => import("./pages/Trainer/DailyUpdates"));
const ManagerDailyUpdates = lazy(() => import("./pages/Manager/DailyUpdates"));
const LearnerPerformance = lazy(() => import("./pages/Learner/Performance"));

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
      <Suspense fallback={<div role="status" aria-live="polite" style={{ padding: 32 }}>Loading workspace…</div>}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Password Reset - requires auth but not role */}
        <Route
          path="/reset-password"
          element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          }
        />

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
          <Route path="insights" element={<RoleBasedRoute allowedRoles={["ADMIN"]}><Insights /></RoleBasedRoute>} />
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
                allowedRoles={["TRAINER", "TA", "ADMIN", "MANAGER", "TEAM_LEADER"]}
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
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;

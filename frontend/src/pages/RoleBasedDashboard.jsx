import React from "react";
import { useAppSelector } from "../store/hooks";
import { LoadingSpinner } from "../components/common";

// Import role-specific dashboards
import LearnerDashboard from "./Learner/Dashboard";
import TrainerDashboard from "./Trainer/Dashboard";
import ManagerDashboard from "./Manager/Dashboard";
import TeamLeaderDashboard from "./TeamLeader/Dashboard";
import AdminDashboard from "./Dashboard"; // Use existing Dashboard as Admin dashboard

export const RoleBasedDashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.loading);

  if (isLoading || !user) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Route to appropriate dashboard based on role
  switch (user.role) {
    case "LEARNER":
      return <LearnerDashboard />;
    case "TRAINER":
      return <TrainerDashboard />;
    case "TA":
      return <TrainerDashboard />; // TAs use same dashboard as trainers
    case "MANAGER":
      return <ManagerDashboard />;
    case "TEAM_LEADER":
      return <TeamLeaderDashboard />;
    case "ADMIN":
    default:
      return <AdminDashboard />;
  }
};

export default RoleBasedDashboard;

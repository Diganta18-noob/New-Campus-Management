import React, { useState } from "react";
import {
  Box,
  Grid,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useBatches, useAttendanceByLearner } from "../../hooks";
import {
  StatCard,
  DashboardCard,
  AttendanceGaugeCard,
  ListCard,
} from "./DashboardWidgets";
import { LoadingSpinner, EmptyState } from "../common";
import { useAppSelector } from "../../store/hooks";

export const LearnerDashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Fetch enrolled batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: {
      enabled: !!user?._id,
    },
  });

  // Fetch attendance for selected batch
  const { data: attendanceData } = useAttendanceByLearner(selectedBatchId, {
    queryConfig: {
      enabled: !!selectedBatchId,
    },
  });

  const enrolledBatches = user?.assignedBatches || [];
  const batches = batchesData?.data || [];

  // Calculate attendance stats
  const calculateAttendanceStats = () => {
    if (!attendanceData?.data)
      return { percentage: 0, present: 0, absent: 0, total: 0 };

    const total = attendanceData.data.length;
    const present = attendanceData.data.filter((a) =>
      ["PRESENT", "LATE"].includes(a.status),
    ).length;
    const absent = attendanceData.data.filter(
      (a) => a.status === "ABSENT",
    ).length;

    return {
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      present,
      absent,
      total,
    };
  };

  const attendanceStats = calculateAttendanceStats();

  if (batchesLoading) {
    return <LoadingSpinner message="Loading your batches..." />;
  }

  if (!enrolledBatches || enrolledBatches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={SchoolIcon}
          title="No Batches Enrolled"
          description="You are not enrolled in any batches yet. Please contact your administrator."
        />
      </Container>
    );
  }

  const selectedBatch =
    enrolledBatches.find((b) => b._id === selectedBatchId) ||
    enrolledBatches[0];
  if (!selectedBatchId && selectedBatch) {
    setSelectedBatchId(selectedBatch._id);
  }

  const upcomingClasses = [
    `${selectedBatch?.name || "Batch"} - Tomorrow at 10:00 AM`,
    `Class in Conference Room A`,
    `Duration: 2 hours`,
  ];

  const recentUpdates = [
    "New assignment posted in Core Concepts",
    "Attendance marked for today",
    "Quiz results available now",
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Welcome, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your learning dashboard
        </Typography>
      </Box>

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Enrolled Batches"
            value={enrolledBatches.length}
            icon={SchoolIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Average Attendance"
            value={`${attendanceStats.percentage}%`}
            icon={TrendingUpIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Courses"
            value="3"
            icon={AssignmentIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Pending Tasks"
            value="2"
            icon={CalendarTodayIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Batch Selection */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Your Batches
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {enrolledBatches.map((batch) => (
            <Chip
              key={batch._id}
              label={batch.name}
              onClick={() => setSelectedBatchId(batch._id)}
              color={selectedBatchId === batch._id ? "primary" : "default"}
              variant={selectedBatchId === batch._id ? "filled" : "outlined"}
              sx={{ cursor: "pointer" }}
            />
          ))}
        </Box>
      </Paper>

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Attendance Gauge */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{ display: "flex", justifyContent: "center", pt: 4 }}
            >
              <AttendanceGaugeCard
                percentage={attendanceStats.percentage}
                label="Your Attendance Percentage"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Breakdown */}
        <Grid item xs={12} md={6}>
          <DashboardCard title="Attendance Breakdown" icon={AssignmentIcon}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper
                  sx={{ p: 2, textAlign: "center", backgroundColor: "#e8f5e9" }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#2e7d32" }}
                  >
                    {attendanceStats.present}
                  </Typography>
                  <Typography variant="caption">Present</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper
                  sx={{ p: 2, textAlign: "center", backgroundColor: "#ffebee" }}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: "bold", color: "#c62828" }}
                  >
                    {attendanceStats.absent}
                  </Typography>
                  <Typography variant="caption">Absent</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Total Classes: {attendanceStats.total}
                </Typography>
              </Grid>
            </Grid>
          </DashboardCard>
        </Grid>

        {/* Upcoming Classes */}
        <Grid item xs={12} md={6}>
          <ListCard title="Upcoming Classes" items={upcomingClasses} />
        </Grid>

        {/* Recent Updates */}
        <Grid item xs={12} md={6}>
          <ListCard title="Recent Updates" items={recentUpdates} />
        </Grid>

        {/* Batch Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                {selectedBatch?.name} Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="caption">
                    Start Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {new Date(selectedBatch?.startDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="caption">
                    End Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {new Date(selectedBatch?.endDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="caption">
                    Status
                  </Typography>
                  <Chip
                    label={selectedBatch?.status}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="caption">
                    Duration
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {Math.ceil(
                      (new Date(selectedBatch?.endDate) -
                        new Date(selectedBatch?.startDate)) /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    href="/my-attendance"
                    sx={{ textTransform: "none" }}
                  >
                    View Attendance
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    href="/performance"
                    sx={{ textTransform: "none" }}
                  >
                    View Performance
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LearnerDashboard;

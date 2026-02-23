import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useBatches, useAttendance, useDailyUpdates } from "../../hooks";
import { StatCard, ListCard } from "./DashboardWidgets";
import { LoadingSpinner, EmptyState } from "../common";
import { useAppSelector } from "../../store/hooks";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const ManagerDashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [dateRange, setDateRange] = useState({
    start: Date.now() - 30 * 24 * 60 * 60 * 1000,
    end: Date.now(),
  });

  // Fetch all batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch daily updates
  const { data: updatesData } = useDailyUpdates({
    queryConfig: { enabled: !!user?._id },
  });

  const batches = batchesData?.data || [];
  const dailyUpdates = updatesData?.data || [];

  // Mock attendance data for chart
  const attendanceChartData = [
    { date: "Mon", percentage: 85 },
    { date: "Tue", percentage: 88 },
    { date: "Wed", percentage: 82 },
    { date: "Thu", percentage: 90 },
    { date: "Fri", percentage: 87 },
  ];

  // Calculate statistics
  const stats = {
    totalBatches: batches.length,
    activeBatches: batches.filter((b) => b.status === "ONGOING").length,
    completedBatches: batches.filter((b) => b.status === "COMPLETED").length,
    totalLearners: batches.reduce(
      (sum, b) => sum + (b.learners?.length || 0),
      0,
    ),
    pendingFeedback: dailyUpdates.filter((u) => u.feedbackStatus === "PENDING")
      .length,
    averageAttendance: 87,
  };

  const updatesNeedingFeedback = dailyUpdates
    .filter((u) => u.feedbackStatus === "PENDING")
    .slice(0, 5)
    .map(
      (u) =>
        `${u.batch?.name || "Unknown"} - ${new Date(u.date).toLocaleDateString()}`,
    );

  if (batchesLoading) {
    return <LoadingSpinner message="Loading batch data..." />;
  }

  if (!batches || batches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={AnalyticsIcon}
          title="No Batches Found"
          description="Start creating batches to see analytics and reports."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Management Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor batches, attendance, and trainer performance
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Batches"
            value={stats.totalBatches}
            icon={AssignmentIcon}
            color="primary"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Batches"
            value={stats.activeBatches}
            icon={TrendingUpIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Learners"
            value={stats.totalLearners}
            icon={GroupIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Avg Attendance"
            value={`${stats.averageAttendance}%`}
            icon={AnalyticsIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Attendance Trend Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Weekly Attendance Trend
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Main Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Batch Status Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Batch Status Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#e3f2fd",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#1565c0" }}
                    >
                      {stats.activeBatches}
                    </Typography>
                    <Typography variant="caption">Active</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#fff3e0",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#e65100" }}
                    >
                      {stats.completedBatches}
                    </Typography>
                    <Typography variant="caption">Completed</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Planning:{" "}
                    {stats.totalBatches -
                      stats.activeBatches -
                      stats.completedBatches}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Feedback */}
        <Grid item xs={12} md={6}>
          <ListCard
            title="Daily Updates Pending Feedback"
            items={updatesNeedingFeedback}
            emptyMessage="All updates reviewed!"
            maxItems={5}
          />
        </Grid>
      </Grid>

      {/* Batches Table */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          All Batches
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Batch Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Learners
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Start Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  End Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: "500" }}>
                      {batch.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {batch.learners?.length || 0}
                  </TableCell>
                  <TableCell align="right">
                    {new Date(batch.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    {new Date(batch.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={batch.status}
                      size="small"
                      variant="outlined"
                      color={
                        batch.status === "ONGOING"
                          ? "success"
                          : batch.status === "COMPLETED"
                            ? "default"
                            : "warning"
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Performance Metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Key Performance Indicators
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "success.main" }}
                    >
                      94%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Trainer Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "info.main" }}
                    >
                      87%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Course Completion
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "warning.main" }}
                    >
                      92%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Student Satisfaction
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      156
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Hours Delivered
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ManagerDashboard;

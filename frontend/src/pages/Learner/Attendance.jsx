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
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { useBatches, useAttendanceByLearner } from "../../hooks";
import { EmptyState, LoadingSpinner } from "../../components/common";
import { useAppSelector } from "../../store/hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", color: "success" },
  { value: "ABSENT", label: "Absent", color: "error" },
  { value: "LATE", label: "Late", color: "warning" },
  { value: "LEAVE", label: "Leave", color: "info" },
  { value: "HALF_DAY", label: "Half Day", color: "warning" },
];

export const LearnerAttendance = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Fetch enrolled batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch attendance for selected batch
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceByLearner(selectedBatchId, {
      queryConfig: { enabled: !!selectedBatchId },
    });

  const enrolledBatches = user?.assignedBatches || [];
  const batches = batchesData?.data || [];
  const attendanceRecords = attendanceData?.data || [];

  // Calculate attendance summary for enrolled batches
  const calculateBatchStats = (batchId) => {
    const batchRecords = attendanceRecords.filter(
      (r) => r.batch?._id === batchId,
    );
    if (batchRecords.length === 0) return null;

    const total = batchRecords.length;
    const present = batchRecords.filter((r) => r.status === "PRESENT").length;
    const absent = batchRecords.filter((r) => r.status === "ABSENT").length;
    const late = batchRecords.filter((r) => r.status === "LATE").length;

    return {
      percentage: Math.round((present / total) * 100),
      present,
      absent,
      late,
      total,
    };
  };

  // Prepare chart data
  const chartData = enrolledBatches.map((batch) => {
    const stats = calculateBatchStats(batch._id);
    return {
      name: batch.name,
      percentage: stats?.percentage || 0,
      present: stats?.present || 0,
      absent: stats?.absent || 0,
      late: stats?.late || 0,
    };
  });

  if (batchesLoading) {
    return <LoadingSpinner message="Loading your attendance data..." />;
  }

  if (!enrolledBatches || enrolledBatches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          title="No Batches Enrolled"
          description="You haven't been enrolled in any batches yet."
        />
      </Container>
    );
  }

  const selectedBatch = enrolledBatches[0];
  if (!selectedBatchId) {
    setSelectedBatchId(selectedBatch._id);
  }

  const selectedBatchStats = calculateBatchStats(selectedBatchId);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          My Attendance
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track your attendance across all enrolled batches
        </Typography>
      </Box>

      {/* Attendance Overview Chart */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Attendance Overview
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="percentage" fill="#3b82f6" name="Attendance %" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Batch Selection Cards */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Your Enrolled Batches
        </Typography>
        <Grid container spacing={3}>
          {enrolledBatches.map((batch) => {
            const stats = calculateBatchStats(batch._id);
            const isSelected = selectedBatchId === batch._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={batch._id}>
                <Card
                  onClick={() => setSelectedBatchId(batch._id)}
                  sx={{
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid #3b82f6"
                      : "1px solid #e0e0e0",
                    backgroundColor: isSelected ? "#f0f7ff" : "white",
                    transition: "all 0.2s",
                    "&:hover": { boxShadow: 2 },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                      {batch.name}
                    </Typography>

                    {stats ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" color="textSecondary">
                              Attendance
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                color:
                                  stats.percentage >= 75
                                    ? "success.main"
                                    : stats.percentage >= 50
                                      ? "warning.main"
                                      : "error.main",
                              }}
                            >
                              {stats.percentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={stats.percentage}
                            sx={{
                              backgroundColor: "#e0e0e0",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  stats.percentage >= 75
                                    ? "#10b981"
                                    : stats.percentage >= 50
                                      ? "#f59e0b"
                                      : "#ef4444",
                              },
                            }}
                          />
                        </Box>

                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Present
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {stats.present}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Absent
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {stats.absent}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" color="textSecondary">
                              Total Classes
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "bold" }}
                            >
                              {stats.total}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No attendance records yet
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Detailed Records */}
      {selectedBatchId && (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Attendance Records - {selectedBatch?.name}
              </Typography>
            </Box>

            {selectedBatchStats && (
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#e8f5e9",
                    }}
                  >
                    <Typography variant="caption" color="textSecondary">
                      Attendance %
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#2e7d32" }}
                    >
                      {selectedBatchStats.percentage}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#e3f2fd",
                    }}
                  >
                    <Typography variant="caption" color="textSecondary">
                      Present
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#1565c0" }}
                    >
                      {selectedBatchStats.present}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#ffebee",
                    }}
                  >
                    <Typography variant="caption" color="textSecondary">
                      Absent
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#c62828" }}
                    >
                      {selectedBatchStats.absent}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#fff3e0",
                    }}
                  >
                    <Typography variant="caption" color="textSecondary">
                      Late
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#e65100" }}
                    >
                      {selectedBatchStats.late}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Paper>

          {/* Records Table */}
          {attendanceLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : attendanceRecords.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.map((record, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            ATTENDANCE_STATUSES.find(
                              (s) => s.value === record.status,
                            )?.label || record.status
                          }
                          size="small"
                          color={
                            ATTENDANCE_STATUSES.find(
                              (s) => s.value === record.status,
                            )?.color || "default"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{record.remarks || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyState
              title="No Records"
              description="No attendance records found for this batch"
            />
          )}
        </>
      )}
    </Container>
  );
};

export default LearnerAttendance;

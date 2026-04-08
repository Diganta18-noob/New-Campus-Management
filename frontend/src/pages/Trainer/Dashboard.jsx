import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import { useBatches, useAttendance, useCreateDailyUpdate } from "../../hooks";
import {
  StatCard,
  DashboardCard,
  ListCard,
} from "../../components/dashboards/DashboardWidgets";
import {
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
} from "../../components/common";
import { useAppSelector } from "../../store/hooks";

export const TrainerDashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [openDailyUpdateModal, setOpenDailyUpdateModal] = useState(false);
  const [dailyUpdateForm, setDailyUpdateForm] = useState({
    summary: "",
    completionPercentage: 100,
  });

  // Fetch assigned batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch today's attendance
  const today = new Date().toISOString().split("T")[0];
  const { data: attendanceData } = useAttendance(
    {
      batch: selectedBatchId,
      date: today,
    },
    { queryConfig: { enabled: !!selectedBatchId } },
  );

  // Mutation to create daily update
  const { mutate: createDailyUpdate, isPending: isSubmitting } =
    useCreateDailyUpdate();

  const assignedBatches = Array.isArray(batchesData) ? batchesData : (batchesData?.data || []);
  const batches = assignedBatches;

  const handleCreateDailyUpdate = () => {
    if (!dailyUpdateForm.summary) {
      alert("Please enter a summary");
      return;
    }

    createDailyUpdate({
      batch: selectedBatchId,
      date: today,
      dailySummary: dailyUpdateForm.summary,
      completionPercentage: dailyUpdateForm.completionPercentage,
      postedBy: user._id,
      status: "PUBLISHED",
    });

    setOpenDailyUpdateModal(false);
    setDailyUpdateForm({ summary: "", completionPercentage: 100 });
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading your batches..." />;
  }

  if (!assignedBatches || assignedBatches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={ScheduleIcon}
          title="No Batches Assigned"
          description="You haven't been assigned to any batches yet."
        />
      </Container>
    );
  }

  const selectedBatch =
    assignedBatches.find((b) => b._id === selectedBatchId) ||
    assignedBatches[0];
  if (!selectedBatchId && selectedBatch) {
    setSelectedBatchId(selectedBatch._id);
  }

  const attendanceRecords = attendanceData?.data || [];
  const batchLearners = selectedBatch?.learners?.length || 0;
  const markedAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (a) => a.status === "PRESENT",
  ).length;

  const quickActions = [
    "Review last week attendance",
    "Generate attendance report",
    "Post performance feedback",
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Welcome, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Your teaching dashboard
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Assigned Batches"
            value={assignedBatches.length}
            icon={ScheduleIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Learners"
            value={batchLearners}
            icon={PersonIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Today's Attendance"
            value={markedAttendance}
            icon={CheckCircleIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Present Today"
            value={presentCount}
            icon={AssignmentIcon}
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
          {assignedBatches.map((batch) => (
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

      {/* Main Actions Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Action Buttons */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    href={`/attendance/mark/${selectedBatchId}`}
                    sx={{ textTransform: "none" }}
                  >
                    Mark Attendance
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    href="/daily-updates"
                    sx={{ textTransform: "none" }}
                  >
                    Daily Updates
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    href="/attendance/history"
                    sx={{ textTransform: "none" }}
                  >
                    View Reports
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Batch Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                Batch Info
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Batch Name
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {selectedBatch?.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Total Learners
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {batchLearners}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedBatch?.status || "ONGOING"}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Today's Attendance Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Today's Attendance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#e8f5e9",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#2e7d32" }}
                    >
                      {presentCount}
                    </Typography>
                    <Typography variant="caption">Present</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "#ffebee",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#c62828" }}
                    >
                      {batchLearners - presentCount}
                    </Typography>
                    <Typography variant="caption">Absent</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <ListCard title="Quick Links" items={quickActions} />
        </Grid>
      </Grid>

      {/* Daily Update Modal */}
      <Dialog
        open={openDailyUpdateModal}
        onClose={() => setOpenDailyUpdateModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Post Daily Update</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Daily Summary"
            placeholder="Enter what was covered today, assignments, and any notes..."
            value={dailyUpdateForm.summary}
            onChange={(e) =>
              setDailyUpdateForm({
                ...dailyUpdateForm,
                summary: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Completion Percentage"
            inputProps={{ min: 0, max: 100 }}
            value={dailyUpdateForm.completionPercentage}
            onChange={(e) =>
              setDailyUpdateForm({
                ...dailyUpdateForm,
                completionPercentage: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDailyUpdateModal(false)}>Cancel</Button>
          <Button
            onClick={handleCreateDailyUpdate}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainerDashboard;

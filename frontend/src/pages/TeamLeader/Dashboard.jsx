import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import { useBatches, useDailyUpdates } from "../../hooks";
import {
  StatCard,
  ListCard,
} from "../../components/dashboards/DashboardWidgets";
import { LoadingSpinner, EmptyState } from "../../components/common";
import { useAppSelector } from "../../store/hooks";

export const TeamLeaderDashboard = () => {
  const user = useAppSelector((state) => state.auth.user);

  // Fetch batches (mentor can see all they're assigned to)
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch daily updates
  const { data: updatesData } = useDailyUpdates({
    queryConfig: { enabled: !!user?._id },
  });

  const batches = batchesData?.data || [];
  const dailyUpdates = updatesData?.data || [];

  // Calculate statistics
  const stats = {
    totalCourses: batches.length,
    activeCourses: batches.filter((b) => b.status === "ONGOING").length,
    totalParticipants: batches.reduce(
      (sum, b) => sum + (b.learners?.length || 0),
      0,
    ),
    averageProgress: 72,
  };

  const coursesList = batches.map((b) => b.name);
  const recentUpdates = dailyUpdates
    .slice(0, 5)
    .map(
      (u) =>
        `${u.batch?.name || "Unknown"} - ${new Date(u.date).toLocaleDateString()}`,
    );

  if (batchesLoading) {
    return <LoadingSpinner message="Loading course data..." />;
  }

  if (!batches || batches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={AnalyticsIcon}
          title="No Courses Assigned"
          description="You haven't been assigned to any courses yet."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Program Lead Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor your programs and participant progress
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Programs"
            value={stats.totalCourses}
            icon={AssignmentIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Active Programs"
            value={stats.activeCourses}
            icon={TrendingUpIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Participants"
            value={stats.totalParticipants}
            icon={GroupIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Avg Progress"
            value={`${stats.averageProgress}%`}
            icon={AnalyticsIcon}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Programs List */}
        <Grid item xs={12} md={6}>
          <ListCard title="Your Programs" items={coursesList} maxItems={10} />
        </Grid>

        {/* Recent Updates */}
        <Grid item xs={12} md={6}>
          <ListCard
            title="Recent Daily Updates"
            items={recentUpdates}
            maxItems={10}
          />
        </Grid>
      </Grid>

      {/* Program Details */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Program Summary
        </Typography>
        <Grid container spacing={3}>
          {batches.slice(0, 3).map((batch) => (
            <Grid item xs={12} md={4} key={batch._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    {batch.name}
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Participants
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {batch.learners?.length || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {Math.ceil(
                          (new Date(batch.endDate) -
                            new Date(batch.startDate)) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Chip
                        label={batch.status}
                        size="small"
                        color={
                          batch.status === "ONGOING" ? "success" : "default"
                        }
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Insights */}
      <Paper sx={{ p: 3, mt: 4, backgroundColor: "#f5f5f5" }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Quick Insights
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Programs on Track
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {stats.activeCourses}/{stats.totalCourses}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Total Training Hours
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              240+
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="textSecondary">
              Trainer Assignments
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: "bold" }}>
              {batches.reduce((sum, b) => sum + (b.trainers?.length || 0), 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TeamLeaderDashboard;

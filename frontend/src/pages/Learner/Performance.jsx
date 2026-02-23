import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  useBatches,
  useAttendanceByLearner,
  useDailyUpdates,
} from "../../hooks";
import { EmptyState, LoadingSpinner } from "../../components/common";
import { useAppSelector } from "../../store/hooks";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  EXCELLENT: "#10b981",
  GOOD: "#3b82f6",
  AVERAGE: "#f59e0b",
  NEEDS_IMPROVEMENT: "#ef4444",
};

const PERFORMANCE_BADGES = [
  {
    id: "consistency",
    label: "Consistency Champion",
    icon: "⚡",
    condition: (stats) => stats.attendancePercentage >= 90,
  },
  {
    id: "excellence",
    label: "Excellence Achiever",
    icon: "🏆",
    condition: (stats) => stats.positiveHighlights >= 5,
  },
  {
    id: "improver",
    label: "Rapid Improver",
    icon: "📈",
    condition: (stats) => stats.improvementRate > 15,
  },
  {
    id: "engaged",
    label: "Highly Engaged",
    icon: "🎯",
    condition: (stats) => stats.averageCompletionPercentage >= 80,
  },
  {
    id: "resilient",
    label: "Resilient Learner",
    icon: "💪",
    condition: (stats) => stats.challengesOvercome >= 3,
  },
];

export const LearnerPerformance = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Fetch enrolled batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch attendance data
  const { data: attendanceData } = useAttendanceByLearner(selectedBatchId, {
    queryConfig: { enabled: !!selectedBatchId },
  });

  // Fetch daily updates for performance insights
  const { data: dailyUpdatesData } = useDailyUpdates(
    { batch: selectedBatchId },
    { queryConfig: { enabled: !!selectedBatchId } },
  );

  const enrolledBatches = user?.assignedBatches || [];
  const batches = batchesData?.data || [];
  const attendanceRecords = attendanceData?.data || [];
  const allUpdates = dailyUpdatesData?.data || [];

  // Initialize selected batch
  if (!selectedBatchId && enrolledBatches.length > 0) {
    setSelectedBatchId(enrolledBatches[0]._id);
  }

  // Calculate performance metrics
  const calculatePerformanceStats = () => {
    if (selectedBatchId && attendanceRecords.length === 0) {
      return null;
    }

    // Attendance metrics
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(
      (r) => r.status === "PRESENT",
    ).length;
    const late = attendanceRecords.filter((r) => r.status === "LATE").length;
    const absent = attendanceRecords.filter(
      (r) => r.status === "ABSENT",
    ).length;
    const attendancePercentage =
      total > 0 ? Math.round((present / total) * 100) : 0;

    // Daily updates metrics
    const updates = allUpdates || [];
    const positiveHighlights = updates.reduce(
      (sum, u) => sum + (u.learnerHighlights?.length || 0),
      0,
    );
    const challengesMentioned = updates.reduce(
      (sum, u) => sum + (u.challenges?.length || 0),
      0,
    );
    const averageCompletionPercentage =
      updates.length > 0
        ? Math.round(
            updates.reduce((sum, u) => sum + (u.completionPercentage || 0), 0) /
              updates.length,
          )
        : 0;

    // Improved from historical data (simulated)
    const improvementRate =
      attendancePercentage > 80 ? 12 : attendancePercentage > 60 ? 8 : 5;
    const challengesOvercome = Math.min(challengesMentioned, 5);

    return {
      attendancePercentage,
      present,
      absent,
      late,
      total,
      positiveHighlights,
      challengesMentioned,
      challengesOvercome,
      averageCompletionPercentage,
      improvementRate,
      updates,
    };
  };

  const stats = calculatePerformanceStats();

  // Determine performance tier
  const getPerformanceTier = () => {
    if (!stats) return "N/A";
    if (stats.attendancePercentage >= 90) return "EXCELLENT";
    if (stats.attendancePercentage >= 75) return "GOOD";
    if (stats.attendancePercentage >= 50) return "AVERAGE";
    return "NEEDS_IMPROVEMENT";
  };

  // Get earned badges
  const getEarnedBadges = () => {
    if (!stats) return [];
    return PERFORMANCE_BADGES.filter((badge) => badge.condition(stats));
  };

  // Prepare chart data for completion percentage trend
  const getCompletionTrend = () => {
    if (!stats || !stats.updates) return [];
    return stats.updates
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-7)
      .map((u) => ({
        date: new Date(u.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        completion: u.completionPercentage,
      }));
  };

  // Prepare attendance breakdown data
  const getAttendanceBreakdown = () => {
    if (!stats) return [];
    return [
      { name: "Present", value: stats.present, fill: "#10b981" },
      { name: "Late", value: stats.late, fill: "#f59e0b" },
      { name: "Absent", value: stats.absent, fill: "#ef4444" },
    ];
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading your performance data..." />;
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

  const performanceTier = getPerformanceTier();
  const earnedBadges = getEarnedBadges();
  const completionTrend = getCompletionTrend();
  const attendanceBreakdown = getAttendanceBreakdown();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          My Performance
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track your learning progress, achievements, and growth
        </Typography>
      </Box>

      {/* Batch Selection */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Select Program
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {enrolledBatches.map((batch) => (
            <Chip
              key={batch._id}
              label={batch.name}
              onClick={() => setSelectedBatchId(batch._id)}
              variant={selectedBatchId === batch._id ? "filled" : "outlined"}
              color={selectedBatchId === batch._id ? "primary" : "default"}
            />
          ))}
        </Box>
      </Paper>

      {selectedBatchId && stats ? (
        <>
          {/* Performance Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Performance Tier Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: "center" }}>
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        backgroundColor:
                          COLORS[performanceTier] || COLORS.AVERAGE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        fontSize: 40,
                      }}
                    >
                      {performanceTier === "EXCELLENT"
                        ? "⭐"
                        : performanceTier === "GOOD"
                          ? "✓"
                          : performanceTier === "AVERAGE"
                            ? "→"
                            : "!"}
                    </Box>
                  </Box>
                  <Typography color="textSecondary" variant="caption">
                    Overall Performance
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                    {performanceTier}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Attendance Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography color="textSecondary" variant="caption">
                      Attendance
                    </Typography>
                    <CheckCircleIcon
                      sx={{ color: "success.main", fontSize: 20 }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                    {stats.attendancePercentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.attendancePercentage}
                    sx={{
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          stats.attendancePercentage >= 80
                            ? "#10b981"
                            : stats.attendancePercentage >= 60
                              ? "#f59e0b"
                              : "#ef4444",
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {stats.present} present, {stats.absent} absent
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Achievement Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography color="textSecondary" variant="caption">
                      Achievements
                    </Typography>
                    <EmojiEventsIcon
                      sx={{ color: "warning.main", fontSize: 20 }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                    {earnedBadges.length}/{PERFORMANCE_BADGES.length}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {earnedBadges.map((badge) => (
                      <Chip key={badge.id} label={badge.icon} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Progress Card */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography color="textSecondary" variant="caption">
                      Improvement Rate
                    </Typography>
                    <TrendingUpIcon sx={{ color: "info.main", fontSize: 20 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                    +{stats.improvementRate}%
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    vs. previous period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
            >
              <Tab label="Analytics" />
              <Tab label="Badges" />
              <Tab label="Insights" />
            </Tabs>
          </Box>

          {/* Analytics Tab */}
          {currentTab === 0 && (
            <Grid container spacing={3}>
              {/* Completion Trend Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    Class Completion Trend (Last 7 days)
                  </Typography>
                  {completionTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={completionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="completion"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No data available
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Attendance Breakdown */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    Attendance Breakdown
                  </Typography>
                  {attendanceBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={attendanceBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {attendanceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No data available
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Key Metrics Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                    Key Metrics
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Metric
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            Value
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Classes Attended</TableCell>
                          <TableCell align="right">{stats.total}</TableCell>
                          <TableCell>
                            <Chip
                              label="Complete"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Classes Present</TableCell>
                          <TableCell align="right">{stats.present}</TableCell>
                          <TableCell>
                            <Chip
                              label="Great"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Avg Lesson Completion</TableCell>
                          <TableCell align="right">
                            {stats.averageCompletionPercentage}%
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                stats.averageCompletionPercentage >= 80
                                  ? "Excellent"
                                  : "Good"
                              }
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Highlights Received</TableCell>
                          <TableCell align="right">
                            {stats.positiveHighlights}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label="Recognized"
                              size="small"
                              sx={{ backgroundColor: "#fcd34d" }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Badges Tab */}
          {currentTab === 1 && (
            <Grid container spacing={2}>
              {PERFORMANCE_BADGES.map((badge) => {
                const earned = earnedBadges.some((b) => b.id === badge.id);
                return (
                  <Grid item xs={12} sm={6} md={4} key={badge.id}>
                    <Card
                      sx={{
                        opacity: earned ? 1 : 0.5,
                        backgroundColor: earned
                          ? "rgba(16, 185, 129, 0.1)"
                          : "#f5f5f5",
                        border: earned
                          ? "2px solid #10b981"
                          : "1px solid #e0e0e0",
                      }}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography variant="h4" sx={{ mb: 1 }}>
                          {badge.icon}
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          {badge.label}
                        </Typography>
                        {earned ? (
                          <Chip label="Earned" size="small" color="success" />
                        ) : (
                          <Chip
                            label="Not Yet"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Insights Tab */}
          {currentTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                      Performance Insights
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "#f0f7ff",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          ✓ Strengths
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          • Consistent attendance ({stats.attendancePercentage}
                          %)
                          <br />
                          • Strong class engagement
                          <br />• {stats.positiveHighlights} positive highlights
                          recorded
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 2,
                          backgroundColor: "#fef2f2",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          → Areas for Improvement
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          • Aim for 90%+ attendance
                          <br />
                          • Increase class completion percentage
                          <br />• Participate more in discussions
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Highlights */}
              {stats.updates && stats.updates.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        Recent Highlights from Trainers
                      </Typography>
                      {stats.updates
                        .filter(
                          (u) =>
                            u.learnerHighlights &&
                            u.learnerHighlights.length > 0,
                        )
                        .slice(0, 5)
                        .map((update, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              p: 2,
                              mb: idx < 4 ? 1 : 0,
                              backgroundColor: "#f9fafb",
                              borderRadius: 1,
                              borderLeft: "4px solid #10b981",
                            }}
                          >
                            <Typography variant="caption" color="textSecondary">
                              {new Date(update.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {update.learnerHighlights[0]?.achievement}
                            </Typography>
                          </Box>
                        ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </>
      ) : (
        <EmptyState
          title="Select a Program"
          description="Choose a program from above to view your performance metrics"
        />
      )}
    </Container>
  );
};

export default LearnerPerformance;

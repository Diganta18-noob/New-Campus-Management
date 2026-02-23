import React, { useState } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { useBatches, useDailyUpdates } from "../../hooks";
import { EmptyState, LoadingSpinner } from "../common";
import { useAppSelector } from "../../store/hooks";

export const ManagerDailyUpdates = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [openFeedbackModal, setOpenFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Fetch batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch daily updates
  const { data: dailyUpdatesData, isLoading: dailyUpdatesLoading } =
    useDailyUpdates(
      {
        batch: selectedBatchId,
        startDate,
        endDate,
      },
      { queryConfig: { enabled: !!selectedBatchId } },
    );

  const batches = batchesData?.data || [];
  const dailyUpdates = dailyUpdatesData?.data || [];

  // Filter updates based on feedback status
  const filteredUpdates =
    filterStatus === "ALL"
      ? dailyUpdates
      : filterStatus === "PENDING"
        ? dailyUpdates.filter((u) => !u.feedback)
        : dailyUpdates.filter((u) => u.feedback);

  const handleOpenFeedback = (update) => {
    setSelectedUpdate(update);
    setFeedbackRating(update.feedbackRating || 3);
    setFeedbackComment(update.feedback || "");
    setOpenFeedbackModal(true);
  };

  const handleSubmitFeedback = () => {
    // This would normally call an API to update the daily update with feedback
    console.log("Submitting feedback:", {
      updateId: selectedUpdate._id,
      rating: feedbackRating,
      comment: feedbackComment,
    });
    setOpenFeedbackModal(false);
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading batches..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Daily Updates Review
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Review trainer daily updates and provide feedback
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Filters
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Select Batch</InputLabel>
              <Select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                label="Select Batch"
              >
                <MenuItem value="">All Batches</MenuItem>
                {batches.map((batch) => (
                  <MenuItem key={batch._id} value={batch._id}>
                    {batch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Feedback Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Feedback Status"
              >
                <MenuItem value="ALL">All Updates</MenuItem>
                <MenuItem value="PENDING">Pending Feedback</MenuItem>
                <MenuItem value="REVIEWED">With Feedback</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {selectedBatchId && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Total Updates
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {dailyUpdates.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Pending Feedback
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "warning.main" }}
                >
                  {dailyUpdates.filter((u) => !u.feedback).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Reviewed
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "success.main" }}
                >
                  {dailyUpdates.filter((u) => u.feedback).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Avg Completion
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {dailyUpdates.length > 0
                    ? Math.round(
                        dailyUpdates.reduce(
                          (sum, u) => sum + u.completionPercentage,
                          0,
                        ) / dailyUpdates.length,
                      )
                    : 0}
                  %
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Updates List */}
      {dailyUpdatesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredUpdates.length > 0 ? (
        <Box>
          {filteredUpdates.map((update) => (
            <Accordion key={update._id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {new Date(update.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      by {update.postedBy?.firstName || "Unknown"} • Completion:{" "}
                      {update.completionPercentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {!update.feedback ? (
                      <Chip
                        label="Pending Feedback"
                        color="warning"
                        variant="outlined"
                      />
                    ) : (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Rating
                          value={update.feedbackRating || 3}
                          readOnly
                          size="small"
                        />
                        <Typography variant="caption">
                          {update.feedbackRating || 3}/5
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {/* Summary */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                      Summary
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {update.summary}
                    </Typography>
                  </Box>

                  {/* Learner Highlights */}
                  {update.learnerHighlights &&
                    update.learnerHighlights.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          Learner Highlights ({update.learnerHighlights.length})
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(250px, 1fr))",
                            gap: 1,
                          }}
                        >
                          {update.learnerHighlights.map((highlight, idx) => (
                            <Card key={idx} variant="outlined">
                              <CardContent
                                sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {highlight.learnerId?.firstName}{" "}
                                  {highlight.learnerId?.lastName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{ mt: 0.5 }}
                                >
                                  <strong>Achievement:</strong>{" "}
                                  {highlight.achievement}
                                </Typography>
                                {highlight.improvementArea && (
                                  <Typography variant="caption" display="block">
                                    <strong>Improvement:</strong>{" "}
                                    {highlight.improvementArea}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}

                  {/* Challenges */}
                  {update.challenges && update.challenges.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Identified Challenges ({update.challenges.length})
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(250px, 1fr))",
                          gap: 1,
                        }}
                      >
                        {update.challenges.map((challenge, idx) => (
                          <Card key={idx} variant="outlined">
                            <CardContent
                              sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ display: "block", mb: 0.5 }}
                              >
                                <Chip
                                  label={challenge.type}
                                  size="small"
                                  sx={{ mr: 0.5 }}
                                />
                                <Chip
                                  label={challenge.severity}
                                  size="small"
                                  color={
                                    challenge.severity === "HIGH"
                                      ? "error"
                                      : challenge.severity === "MEDIUM"
                                        ? "warning"
                                        : "info"
                                  }
                                />
                              </Typography>
                              <Typography variant="caption" display="block">
                                <strong>Description:</strong>{" "}
                                {challenge.description}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Existing Feedback */}
                  {update.feedback && (
                    <Box
                      sx={{
                        mb: 3,
                        p: 2,
                        backgroundColor: "#f0f7ff",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        Your Feedback
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Rating
                          value={update.feedbackRating || 3}
                          readOnly
                          size="small"
                        />
                        <Typography variant="caption">
                          {update.feedbackRating || 3}/5
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {update.feedback}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Button */}
                  <Button
                    variant={update.feedback ? "outlined" : "contained"}
                    startIcon={<FeedbackIcon />}
                    onClick={() => handleOpenFeedback(update)}
                  >
                    {update.feedback ? "Edit Feedback" : "Add Feedback"}
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        <EmptyState
          title="No Updates Found"
          description={
            selectedBatchId
              ? "No daily updates found for the selected filters"
              : "Select a batch to view daily updates"
          }
        />
      )}

      {/* Feedback Modal */}
      <Dialog
        open={openFeedbackModal}
        onClose={() => setOpenFeedbackModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Provide Feedback -{" "}
          {selectedUpdate &&
            new Date(selectedUpdate.createdAt).toLocaleDateString()}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              How would you rate this daily update?
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Rating
                value={feedbackRating}
                onChange={(e, newValue) => setFeedbackRating(newValue)}
                size="large"
              />
              <Typography variant="body2">{feedbackRating}/5</Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
              Your Feedback/Comments
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Provide constructive feedback, suggestions for improvement, or acknowledgments..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFeedbackModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitFeedback}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDailyUpdates;

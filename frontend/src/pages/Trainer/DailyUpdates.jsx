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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import { useBatches, useCreateDailyUpdate, useDailyUpdates } from "../../hooks";
import { EmptyState, LoadingSpinner, ConfirmDialog } from "../common";
import { useAppSelector } from "../../store/hooks";

const CHALLENGE_SEVERITIES = [
  { value: "LOW", label: "Low", color: "info" },
  { value: "MEDIUM", label: "Medium", color: "warning" },
  { value: "HIGH", label: "High", color: "error" },
];

const CHALLENGE_TYPES = [
  { value: "CONCEPTS", label: "Concepts Understanding", color: "primary" },
  { value: "MOTIVATION", label: "Motivation Issues", color: "secondary" },
  { value: "TECHNICAL", label: "Technical Issues", color: "info" },
  { value: "ATTENDANCE", label: "Attendance Issues", color: "warning" },
  { value: "BEHAVIORAL", label: "Behavioral Issues", color: "error" },
  { value: "RESOURCES", label: "Resource Constraints", color: "success" },
];

export const TrainerDailyUpdates = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [openForm, setOpenForm] = useState(false);

  // Form state
  const [summary, setSummary] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState(75);
  const [learnerHighlights, setLearnerHighlights] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [newHighlight, setNewHighlight] = useState({
    learnerId: "",
    achievement: "",
    improvementArea: "",
    remarks: "",
  });
  const [newChallenge, setNewChallenge] = useState({
    type: "CONCEPTS",
    severity: "MEDIUM",
    description: "",
    resolution: "",
    status: "OPEN",
  });

  // Fetch data
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  const { data: dailyUpdatesData, isLoading: dailyUpdatesLoading } =
    useDailyUpdates(
      {
        batch: selectedBatchId,
        postedBy: user?._id,
      },
      { queryConfig: { enabled: !!selectedBatchId && !!user?._id } },
    );

  const { mutate: createDailyUpdate, isPending: isSubmitting } =
    useCreateDailyUpdate();

  const batches = batchesData?.data || [];
  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  const batchLearners = selectedBatch?.learners || [];
  const dailyUpdates = dailyUpdatesData?.data || [];

  const handleAddHighlight = () => {
    if (newHighlight.learnerId && newHighlight.achievement) {
      setLearnerHighlights([...learnerHighlights, newHighlight]);
      setNewHighlight({
        learnerId: "",
        achievement: "",
        improvementArea: "",
        remarks: "",
      });
    }
  };

  const handleRemoveHighlight = (index) => {
    setLearnerHighlights(learnerHighlights.filter((_, i) => i !== index));
  };

  const handleAddChallenge = () => {
    if (newChallenge.description) {
      setChallenges([...challenges, newChallenge]);
      setNewChallenge({
        type: "CONCEPTS",
        severity: "MEDIUM",
        description: "",
        resolution: "",
        status: "OPEN",
      });
    }
  };

  const handleRemoveChallenge = (index) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!summary.trim()) {
      alert("Please provide a summary");
      return;
    }

    createDailyUpdate({
      batch: selectedBatchId,
      summary,
      completionPercentage,
      learnerHighlights,
      challenges,
      postedBy: user._id,
      status: "PUBLISHED",
    });

    // Reset form
    setSummary("");
    setCompletionPercentage(75);
    setLearnerHighlights([]);
    setChallenges([]);
    setOpenForm(false);
  };

  const handleSaveDraft = () => {
    if (!summary.trim()) {
      alert("Please provide a summary");
      return;
    }

    createDailyUpdate({
      batch: selectedBatchId,
      summary,
      completionPercentage,
      learnerHighlights,
      challenges,
      postedBy: user._id,
      status: "DRAFT",
    });

    // Reset form
    setSummary("");
    setCompletionPercentage(75);
    setLearnerHighlights([]);
    setChallenges([]);
    setOpenForm(false);
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading your batches..." />;
  }

  if (!batches || batches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          title="No Batches Assigned"
          description="You haven't been assigned to any batches yet."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Daily Updates
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Document learner progress, challenges, and highlights
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
          disabled={!selectedBatchId}
        >
          New Update
        </Button>
      </Box>

      {/* Batch Selection */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
          Select Batch
        </Typography>
        <Grid container spacing={2}>
          {batches.map((batch) => (
            <Grid item xs={12} sm={6} md={3} key={batch._id}>
              <Card
                onClick={() => setSelectedBatchId(batch._id)}
                sx={{
                  cursor: "pointer",
                  border:
                    selectedBatchId === batch._id
                      ? "2px solid #3b82f6"
                      : "1px solid #e0e0e0",
                  backgroundColor:
                    selectedBatchId === batch._id ? "#f0f7ff" : "white",
                  transition: "all 0.2s",
                  "&:hover": { boxShadow: 2 },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {batch.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {batch.learners?.length || 0} learners
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Tabs */}
      {selectedBatchId && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              aria-label="update tabs"
            >
              <Tab label="Recent Updates" />
              <Tab label="Statistics" />
            </Tabs>
          </Box>

          {/* Recent Updates Tab */}
          {currentTab === 0 && (
            <>
              {dailyUpdatesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : dailyUpdates.length > 0 ? (
                <Grid container spacing={3}>
                  {dailyUpdates.map((update) => (
                    <Grid item xs={12} key={update._id}>
                      <Card>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: "bold" }}
                              >
                                {new Date(
                                  update.createdAt,
                                ).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={update.status}
                                size="small"
                                color={
                                  update.status === "PUBLISHED"
                                    ? "success"
                                    : "default"
                                }
                                sx={{ mt: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                              Completion: {update.completionPercentage}%
                            </Typography>
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{ mb: 2, color: "text.secondary" }}
                          >
                            {update.summary}
                          </Typography>

                          {update.learnerHighlights &&
                            update.learnerHighlights.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Learner Highlights:{" "}
                                  {update.learnerHighlights.length}
                                </Typography>
                              </Box>
                            )}

                          {update.challenges &&
                            update.challenges.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Challenges Identified:{" "}
                                  {update.challenges.length}
                                </Typography>
                              </Box>
                            )}

                          {update.feedback && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: "bold" }}
                              >
                                Manager Feedback:
                              </Typography>
                              <Typography variant="body2">
                                {update.feedback}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  title="No Updates Yet"
                  description="Create your first daily update for this batch"
                />
              )}
            </>
          )}

          {/* Statistics Tab */}
          {currentTab === 1 && (
            <Grid container spacing={3}>
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
                      Published
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {
                        dailyUpdates.filter((u) => u.status === "PUBLISHED")
                          .length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography color="textSecondary" variant="caption">
                      Avg Completion %
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
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography color="textSecondary" variant="caption">
                      With Feedback
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                      {dailyUpdates.filter((u) => u.feedback).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Create/Edit Daily Update Dialog */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Daily Update</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Summary Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Summary
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Provide a summary of today's class, key topics covered, learner engagement level..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Completion Percentage */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              Class Completion Percentage
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Slider
                value={completionPercentage}
                onChange={(e, newValue) => setCompletionPercentage(newValue)}
                min={0}
                max={100}
                step={5}
                sx={{ flex: 1 }}
              />
              <Typography sx={{ minWidth: 60, fontWeight: "bold" }}>
                {completionPercentage}%
              </Typography>
            </Box>
          </Box>

          {/* Learner Highlights Section */}
          <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Learner Highlights
            </Typography>

            {learnerHighlights.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 200, overflowY: "auto" }}>
                {learnerHighlights.map((highlight, idx) => {
                  const learner = batchLearners.find(
                    (l) => l._id === highlight.learnerId,
                  );
                  return (
                    <Card key={idx} sx={{ mb: 1 }}>
                      <CardContent
                        sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {learner?.firstName} {learner?.lastName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveHighlight(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" display="block">
                          <strong>Achievement:</strong> {highlight.achievement}
                        </Typography>
                        {highlight.improvementArea && (
                          <Typography variant="caption" display="block">
                            <strong>Improvement:</strong>{" "}
                            {highlight.improvementArea}
                          </Typography>
                        )}
                        {highlight.remarks && (
                          <Typography variant="caption" display="block">
                            <strong>Remarks:</strong> {highlight.remarks}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 1,
              }}
            >
              <FormControl size="small">
                <InputLabel>Select Learner</InputLabel>
                <Select
                  value={newHighlight.learnerId}
                  onChange={(e) =>
                    setNewHighlight({
                      ...newHighlight,
                      learnerId: e.target.value,
                    })
                  }
                  label="Select Learner"
                >
                  {batchLearners.map((learner) => (
                    <MenuItem key={learner._id} value={learner._id}>
                      {learner.firstName} {learner.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Achievement/Accomplishment"
                value={newHighlight.achievement}
                onChange={(e) =>
                  setNewHighlight({
                    ...newHighlight,
                    achievement: e.target.value,
                  })
                }
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 1,
              }}
            >
              <TextField
                size="small"
                placeholder="Area for Improvement (optional)"
                value={newHighlight.improvementArea}
                onChange={(e) =>
                  setNewHighlight({
                    ...newHighlight,
                    improvementArea: e.target.value,
                  })
                }
              />
              <TextField
                size="small"
                placeholder="Remarks (optional)"
                value={newHighlight.remarks}
                onChange={(e) =>
                  setNewHighlight({ ...newHighlight, remarks: e.target.value })
                }
              />
            </Box>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={handleAddHighlight}
              disabled={!newHighlight.learnerId || !newHighlight.achievement}
            >
              Add Highlight
            </Button>
          </Box>

          {/* Challenges Section */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
              Identified Challenges
            </Typography>

            {challenges.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 200, overflowY: "auto" }}>
                {challenges.map((challenge, idx) => {
                  const typeObj = CHALLENGE_TYPES.find(
                    (t) => t.value === challenge.type,
                  );
                  const severityObj = CHALLENGE_SEVERITIES.find(
                    (s) => s.value === challenge.severity,
                  );
                  return (
                    <Card key={idx} sx={{ mb: 1 }}>
                      <CardContent
                        sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Chip label={typeObj?.label} size="small" />
                            <Chip
                              label={severityObj?.label}
                              size="small"
                              color={severityObj?.color}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveChallenge(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" display="block">
                          <strong>Description:</strong> {challenge.description}
                        </Typography>
                        {challenge.resolution && (
                          <Typography variant="caption" display="block">
                            <strong>Resolution:</strong> {challenge.resolution}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                mb: 1,
              }}
            >
              <FormControl size="small">
                <InputLabel>Challenge Type</InputLabel>
                <Select
                  value={newChallenge.type}
                  onChange={(e) =>
                    setNewChallenge({ ...newChallenge, type: e.target.value })
                  }
                  label="Challenge Type"
                >
                  {CHALLENGE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  value={newChallenge.severity}
                  onChange={(e) =>
                    setNewChallenge({
                      ...newChallenge,
                      severity: e.target.value,
                    })
                  }
                  label="Severity"
                >
                  {CHALLENGE_SEVERITIES.map((severity) => (
                    <MenuItem key={severity.value} value={severity.value}>
                      {severity.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Describe the challenge..."
              value={newChallenge.description}
              onChange={(e) =>
                setNewChallenge({
                  ...newChallenge,
                  description: e.target.value,
                })
              }
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              size="small"
              placeholder="Suggested resolution/action items..."
              value={newChallenge.resolution}
              onChange={(e) =>
                setNewChallenge({ ...newChallenge, resolution: e.target.value })
              }
              sx={{ mb: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              fullWidth
              onClick={handleAddChallenge}
              disabled={!newChallenge.description}
            >
              Add Challenge
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button onClick={handleSaveDraft} variant="outlined">
            Save as Draft
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Publish Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TrainerDailyUpdates;

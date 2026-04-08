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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import { useBatches, useMarkAttendance } from "../../hooks";
import {
  LoadingSpinner,
  EmptyState,
  ConfirmDialog,
} from "../../components/common";
import { useAppSelector } from "../../store/hooks";

const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", color: "success" },
  { value: "ABSENT", label: "Absent", color: "error" },
  { value: "LATE", label: "Late", color: "warning" },
  { value: "LEAVE", label: "Leave", color: "info" },
  { value: "HALF_DAY", label: "Half Day", color: "warning" },
];

export const AttendanceMarking = ({ batchId: initialBatchId }) => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || "");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [classroomId, setClassroomId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [remarks, setRemarks] = useState({});
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRemark, setSelectedRemark] = useState("");

  // Fetch batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Mark attendance mutation
  const { mutate: markAttendance, isPending: isSubmitting } =
    useMarkAttendance();

  const batches = Array.isArray(batchesData) ? batchesData : (batchesData?.data || []);
  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  const batchLearners = selectedBatch?.learners || [];

  const handleStatusChange = (learnerId, status) => {
    setAttendanceRecords({
      ...attendanceRecords,
      [learnerId]: status,
    });
  };

  const handleRemarkChange = (learnerId, remark) => {
    setRemarks({
      ...remarks,
      [learnerId]: remark,
    });
  };

  const handleBulkMark = (status) => {
    const newRecords = {};
    batchLearners.forEach((learner) => {
      newRecords[learner._id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const handleSubmit = () => {
    if (!selectedBatchId) {
      alert("Please select a batch");
      return;
    }

    if (Object.keys(attendanceRecords).length === 0) {
      alert("Please mark attendance for at least one learner");
      return;
    }

    // Prepare attendance data
    const attendanceData = Object.entries(attendanceRecords).map(
      ([learnerId, status]) => ({
        learner: learnerId,
        status,
        remarks: remarks[learnerId] || "",
      }),
    );

    markAttendance({
      date: selectedDate,
      batch: selectedBatchId,
      classroom: classroomId,
      attendanceRecords: attendanceData,
      markedBy: user._id,
      sessionStartTime: new Date(),
      sessionEndTime: new Date(),
    });

    // Reset form
    setAttendanceRecords({});
    setRemarks({});
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading batches..." />;
  }

  if (!batches || batches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={CheckCircleIcon}
          title="No Batches Found"
          description="You haven't been assigned to any batches yet."
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Mark Attendance
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Record learner attendance for your batch
        </Typography>
      </Box>

      {/* Selection Card */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
          Attendance Details
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
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Classroom (Optional)</InputLabel>
              <Select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                label="Classroom (Optional)"
              >
                <MenuItem value="">None</MenuItem>
                {selectedBatch?.classroom && (
                  <MenuItem value={selectedBatch.classroom._id}>
                    {selectedBatch.classroom.name}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Typography sx={{ pt: 1 }}>
                {batchLearners.length} learners
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions */}
      {selectedBatchId && batchLearners.length > 0 && (
        <Paper sx={{ p: 2, mb: 4, backgroundColor: "#f5f5f5" }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: "bold" }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {ATTENDANCE_STATUSES.map((status) => (
              <Button
                key={status.value}
                variant="outlined"
                size="small"
                onClick={() => handleBulkMark(status.value)}
              >
                Mark All {status.label}
              </Button>
            ))}
            <Button
              variant="text"
              size="small"
              onClick={() => setAttendanceRecords({})}
            >
              Clear All
            </Button>
          </Box>
        </Paper>
      )}

      {/* Attendance Table */}
      {selectedBatchId && batchLearners.length > 0 ? (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                    Learner Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "20%" }}>
                    Roll Number
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: "30%" }}>
                    Remarks
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batchLearners.map((learner) => (
                  <TableRow key={learner._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>
                        {learner.firstName} {learner.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {learner.rollNumber || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Select
                        size="small"
                        value={attendanceRecords[learner._id] || ""}
                        onChange={(e) =>
                          handleStatusChange(learner._id, e.target.value)
                        }
                        displayEmpty
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="">
                          <Typography color="textSecondary">
                            Not marked
                          </Typography>
                        </MenuItem>
                        {ATTENDANCE_STATUSES.map((status) => (
                          <MenuItem key={status.value} value={status.value}>
                            <Chip
                              label={status.label}
                              size="small"
                              color={status.color}
                              variant="outlined"
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Add remark..."
                        value={remarks[learner._id] || ""}
                        onChange={(e) =>
                          handleRemarkChange(learner._id, e.target.value)
                        }
                        fullWidth
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "#f9f9f9",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                    Marked
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {Object.keys(attendanceRecords).length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                    Remaining
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {batchLearners.length -
                      Object.keys(attendanceRecords).length}
                  </Typography>
                </Box>
              </Grid>
              <Grid
                item
                xs={12}
                md={8}
                sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
              >
                <Button variant="outlined">Save as Draft</Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Attendance"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ) : (
        <EmptyState
          title="Select a Batch"
          description="Choose a batch above to mark attendance for its learners"
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={openConfirm}
        title="Confirm Attendance Submission"
        message={`Mark attendance for ${Object.keys(attendanceRecords).length} learner(s)? This action cannot be undone.`}
        onConfirm={handleSubmit}
        onCancel={() => setOpenConfirm(false)}
        isLoading={isSubmitting}
      />
    </Container>
  );
};

export default AttendanceMarking;

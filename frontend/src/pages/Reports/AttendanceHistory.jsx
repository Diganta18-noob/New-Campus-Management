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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useBatches, useAttendance } from "../../hooks";
import { SimpleDataTable, EmptyState, LoadingSpinner } from "../common";
import { useAppSelector } from "../../store/hooks";

const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", color: "success" },
  { value: "ABSENT", label: "Absent", color: "error" },
  { value: "LATE", label: "Late", color: "warning" },
  { value: "LEAVE", label: "Leave", color: "info" },
  { value: "HALF_DAY", label: "Half Day", color: "warning" },
];

export const AttendanceHistory = () => {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editedStatus, setEditedStatus] = useState("");
  const [editedRemark, setEditedRemark] = useState("");

  // Fetch batches
  const { data: batchesData, isLoading: batchesLoading } = useBatches({
    queryConfig: { enabled: !!user?._id },
  });

  // Fetch attendance records
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance(
    {
      batch: selectedBatchId,
      startDate,
      endDate,
    },
    { queryConfig: { enabled: !!selectedBatchId } },
  );

  const batches = batchesData?.data || [];
  const attendanceRecords = attendanceData?.data || [];

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "learnerName",
      label: "Learner",
      render: (value, row) =>
        `${row.learner?.firstName} ${row.learner?.lastName}`,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const status = ATTENDANCE_STATUSES.find((s) => s.value === value);
        return (
          <Chip
            label={status?.label || value}
            size="small"
            color={status?.color || "default"}
            variant="outlined"
          />
        );
      },
    },
    {
      key: "remarks",
      label: "Remarks",
      render: (value) => value || "-",
    },
    {
      key: "markedBy",
      label: "Marked By",
      render: (value, row) =>
        row.markedBy?.firstName ? `${row.markedBy.firstName}` : "System",
    },
  ];

  const handleExport = () => {
    if (attendanceRecords.length === 0) {
      alert("No records to export");
      return;
    }

    const csvContent = [
      ["Date", "Learner", "Status", "Remarks", "Marked By"],
      ...attendanceRecords.map((record) => [
        new Date(record.date).toLocaleDateString(),
        `${record.learner?.firstName} ${record.learner?.lastName}`,
        ATTENDANCE_STATUSES.find((s) => s.value === record.status)?.label ||
          record.status,
        record.remarks || "",
        record.markedBy?.firstName || "System",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
    );
    element.setAttribute(
      "download",
      `attendance_${selectedBatchId}_${Date.now()}.csv`,
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (batchesLoading) {
    return <LoadingSpinner message="Loading batches..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          Attendance History
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage attendance records
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

          <Grid item xs={12} sm={6} md={3} sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" fullWidth>
              Apply Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={attendanceRecords.length === 0}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Records Summary */}
      {selectedBatchId && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Total Records
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {attendanceRecords.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography color="textSecondary" variant="caption">
                  Present
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "success.main" }}
                >
                  {
                    attendanceRecords.filter((r) => r.status === "PRESENT")
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
                  Absent
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "error.main" }}
                >
                  {
                    attendanceRecords.filter((r) => r.status === "ABSENT")
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
                  Late
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "warning.main" }}
                >
                  {attendanceRecords.filter((r) => r.status === "LATE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: "bold" }}>
                    {col.label}
                  </TableCell>
                ))}
                {user?.role === "ADMIN" && (
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceRecords.map((record, idx) => (
                <TableRow key={idx} hover>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(record[col.key], record)
                        : record[col.key]}
                    </TableCell>
                  ))}
                  {user?.role === "ADMIN" && (
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setSelectedAttendance(record);
                            setEditedStatus(record.status);
                            setEditedRemark(record.remarks || "");
                            setOpenEditModal(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <EmptyState
          title="No Records"
          description="No attendance records found for the selected filters"
        />
      )}

      {/* Edit Modal */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Attendance Record</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value)}
              label="Status"
            >
              {ATTENDANCE_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks"
            value={editedRemark}
            onChange={(e) => setEditedRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AttendanceHistory;

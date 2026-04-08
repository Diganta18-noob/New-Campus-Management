import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Topic as TopicIcon,
} from "@mui/icons-material";
import { useTopics, useBatches, useUsers } from "../../hooks";
import { useCreateTopic, useUpdateTopic, useDeleteTopic } from "../../hooks";
import { LoadingSpinner, EmptyState, ConfirmDialog } from "../../components/common";

const initialFormData = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  batch: "",
  trainers: [],
  tas: [],
  classroom: "",
};

const TopicsManagement = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, topic: null });
  const [error, setError] = useState("");

  // Queries
  const { data: topicsData, isLoading: topicsLoading, error: topicsError } = useTopics({
    page: page + 1,
    limit: rowsPerPage,
    search,
  });
  const { data: batchesData } = useBatches();
  const { data: trainersData } = useUsers({ role: "TRAINER", limit: 100 });
  const { data: tasData } = useUsers({ role: "TA", limit: 100 });

  // Mutations
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  const topics = topicsData?.data || topicsData || [];
  const totalCount = topicsData?.total || topics.length;
  const batches = batchesData?.data || batchesData || [];
  const trainers = trainersData?.data || trainersData || [];
  const tas = tasData?.data || tasData || [];

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setFormData(initialFormData);
    setError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (topic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name || "",
      description: topic.description || "",
      startDate: topic.startDate ? topic.startDate.split("T")[0] : "",
      endDate: topic.endDate ? topic.endDate.split("T")[0] : "",
      batch: topic.batch?._id || topic.batch || "",
      trainers: topic.trainers?.map((t) => t._id || t) || [],
      tas: topic.tas?.map((t) => t._id || t) || [],
      classroom: topic.classroom?._id || topic.classroom || "",
    });
    setError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTopic(null);
    setFormData(initialFormData);
    setError("");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Topic name is required");
      return;
    }
    try {
      if (editingTopic) {
        await updateTopic.mutateAsync({
          id: editingTopic._id,
          data: formData,
        });
      } else {
        await createTopic.mutateAsync(formData);
      }
      handleCloseDialog();
    } catch (err) {
      setError(err?.message || err || "An error occurred");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.topic) return;
    try {
      await deleteTopic.mutateAsync(deleteConfirm.topic._id);
      setDeleteConfirm({ open: false, topic: null });
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (topicsLoading) {
    return <LoadingSpinner message="Loading topics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Topics / Courses
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage training topics, courses, and their assignments
          </Typography>
        </div>
        <Button
          id="btn-create-topic"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "12px",
            px: 3,
            py: 1.5,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add Topic
        </Button>
      </div>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <TextField
          id="search-topics"
          fullWidth
          placeholder="Search topics by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      {/* Topics Table */}
      {topicsError ? (
        <Alert severity="error">Failed to load topics. The server may not have a topics endpoint yet.</Alert>
      ) : topics.length === 0 ? (
        <EmptyState
          title="No Topics Found"
          description={search ? "No topics match your search" : "Create your first topic to get started"}
          icon={TopicIcon}
        />
      ) : (
        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold text-gray-600">Topic Name</TableCell>
                  <TableCell className="font-semibold text-gray-600">Batch</TableCell>
                  <TableCell className="font-semibold text-gray-600">Duration</TableCell>
                  <TableCell className="font-semibold text-gray-600">Trainers</TableCell>
                  <TableCell className="font-semibold text-gray-600">Status</TableCell>
                  <TableCell className="font-semibold text-gray-600" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topics.map((topic) => {
                  const now = new Date();
                  const start = topic.startDate ? new Date(topic.startDate) : null;
                  const end = topic.endDate ? new Date(topic.endDate) : null;
                  let status = "Upcoming";
                  let statusColor = "info";
                  if (start && end) {
                    if (now >= start && now <= end) {
                      status = "Active";
                      statusColor = "success";
                    } else if (now > end) {
                      status = "Completed";
                      statusColor = "default";
                    }
                  }

                  return (
                    <TableRow key={topic._id} hover className="transition-colors">
                      <TableCell>
                        <div>
                          <Typography variant="body2" className="font-semibold text-gray-800">
                            {topic.name}
                          </Typography>
                          {topic.description && (
                            <Typography variant="caption" className="text-gray-500 line-clamp-1">
                              {topic.description}
                            </Typography>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={topic.batch?.name || "Unassigned"}
                          size="small"
                          variant="outlined"
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" className="text-gray-600">
                          {start ? start.toLocaleDateString() : "N/A"} –{" "}
                          {end ? end.toLocaleDateString() : "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {topic.trainers?.length > 0
                          ? topic.trainers.map((t) => (
                              <Chip
                                key={t._id || t}
                                label={t.firstName ? `${t.firstName} ${t.lastName?.[0] || ""}` : "Trainer"}
                                size="small"
                                className="mr-1 mb-1"
                                variant="outlined"
                              />
                            ))
                          : <span className="text-gray-400 text-sm">None</span>}
                      </TableCell>
                      <TableCell>
                        <Chip label={status} color={statusColor} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(topic)} id={`btn-edit-topic-${topic._id}`}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({ open: true, topic })}
                            id={`btn-delete-topic-${topic._id}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Paper>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <span className="font-bold">
            {editingTopic ? "Edit Topic / Course" : "Create Topic / Course"}
          </span>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" className="mb-4" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <Grid container spacing={3} className="mt-1">
            <Grid item xs={12}>
              <TextField
                id="topic-name"
                fullWidth
                label="Topic / Course Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="topic-description"
                fullWidth
                label="Description / Syllabus"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="topic-start-date"
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="topic-end-date"
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign to Batch</InputLabel>
                <Select
                  id="topic-batch"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  label="Assign to Batch"
                >
                  <MenuItem value="">None</MenuItem>
                  {batches.map((batch) => (
                    <MenuItem key={batch._id} value={batch._id}>
                      {batch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="topic-classroom"
                fullWidth
                label="Classroom"
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                placeholder="Classroom name or code"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign Trainers</InputLabel>
                <Select
                  id="topic-trainers"
                  multiple
                  value={formData.trainers}
                  onChange={(e) => setFormData({ ...formData, trainers: e.target.value })}
                  label="Assign Trainers"
                  renderValue={(selected) =>
                    selected
                      .map((id) => {
                        const t = trainers.find((tr) => tr._id === id);
                        return t ? `${t.firstName} ${t.lastName || ""}` : id;
                      })
                      .join(", ")
                  }
                >
                  {trainers.map((trainer) => (
                    <MenuItem key={trainer._id} value={trainer._id}>
                      {trainer.firstName} {trainer.lastName || ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign TAs</InputLabel>
                <Select
                  id="topic-tas"
                  multiple
                  value={formData.tas}
                  onChange={(e) => setFormData({ ...formData, tas: e.target.value })}
                  label="Assign TAs"
                  renderValue={(selected) =>
                    selected
                      .map((id) => {
                        const t = tas.find((ta) => ta._id === id);
                        return t ? `${t.firstName} ${t.lastName || ""}` : id;
                      })
                      .join(", ")
                  }
                >
                  {tas.map((ta) => (
                    <MenuItem key={ta._id} value={ta._id}>
                      {ta.firstName} {ta.lastName || ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={handleCloseDialog} id="btn-cancel-topic">
            Cancel
          </Button>
          <Button
            id="btn-submit-topic"
            variant="contained"
            onClick={handleSubmit}
            disabled={createTopic.isPending || updateTopic.isPending}
            startIcon={
              (createTopic.isPending || updateTopic.isPending) ? (
                <CircularProgress size={16} />
              ) : null
            }
          >
            {editingTopic ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Topic"
        message={`Are you sure you want to delete "${deleteConfirm.topic?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, topic: null })}
        loading={deleteTopic.isPending}
      />
    </div>
  );
};

export default TopicsManagement;

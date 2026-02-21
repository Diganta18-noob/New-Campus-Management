import { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Box,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import DataTable from "../../components/ui/DataTable";
import { batchesAPI, departmentsAPI } from "../../services/api";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 300,
    },
  },
};

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [availableTAs, setAvailableTAs] = useState([]);
  const [availableLearners, setAvailableLearners] = useState([]);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department: "",
    clientName: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "PLANNING",
    classroom: "",
    trainers: [],
    tas: [],
    learners: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, departmentsRes] = await Promise.all([
        batchesAPI.getAll(),
        departmentsAPI.getAll({ limit: 100, status: "ACTIVE" }),
      ]);

      // Transform batches data for DataTable
      const transformedBatches = (batchesRes.data || []).map((batch) => ({
        ...batch,
        id: batch._id,
        departmentName: batch.department?.name || "N/A",
        departmentCode: batch.department?.code || "N/A",
        trainerCount: batch.trainers?.length || 0,
        taCount: batch.tas?.length || 0,
        learnerCount: batch.learners?.length || 0,
        classroomName: batch.classroom?.name || "Unassigned",
        classroomCode: batch.classroom?.code || "N/A",
        classroomLocation: batch.classroom?.location || "N/A",
        classroomCapacity: batch.classroom?.capacity || "N/A",
      }));
      setBatches(transformedBatches);

      // Transform departments data
      const transformedDepts = (departmentsRes.data || []).map((dept) => ({
        ...dept,
        id: dept._id,
      }));
      setDepartments(transformedDepts);
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar(error.message || "Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async (batchId = null, startDate = "") => {
    try {
      setLoadingStaff(true);
      const [trainersRes, tasRes, learnersRes, classroomsRes] =
        await Promise.all([
          batchesAPI.getAvailableTrainers(batchId, startDate),
          batchesAPI.getAvailableTAs(),
          batchesAPI.getAvailableLearners(batchId, startDate),
          batchesAPI.getAvailableClassrooms(batchId, startDate),
        ]);
      setAvailableTrainers(trainersRes.data || []);
      setAvailableTAs(tasRes.data || []);
      setAvailableLearners(learnersRes.data || []);
      setAvailableClassrooms(classroomsRes.data || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      showSnackbar("Error loading resources", "error");
    } finally {
      setLoadingStaff(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Generate batch code from department and client
  const generateCode = (departmentId, clientName) => {
    if (!departmentId || !clientName) return "";
    const dept = departments.find((d) => d._id === departmentId);
    if (!dept) return "";

    const deptCode = dept.code?.toLowerCase() || "";
    const clientCode = clientName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toLowerCase();
    const date = new Date();
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const month = monthNames[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);

    return `${deptCode}-${clientCode}-${month}${year}`.toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PLANNING":
        return "bg-blue-100 text-blue-700";
      case "ONGOING":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-gray-100 text-gray-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const columns = [
    { field: "name", headerName: "Batch Name" },
    {
      field: "code",
      headerName: "Code",
      renderCell: (row) => (
        <span className="font-mono text-gray-700 uppercase text-sm">
          {row.code}
        </span>
      ),
    },
    {
      field: "departmentName",
      headerName: "Department",
      renderCell: (row) => (
        <div className="flex flex-col">
          <Chip
            label={row.departmentName}
            size="small"
            className="bg-purple-100 text-purple-700"
          />
        </div>
      ),
    },
    {
      field: "classroom",
      headerName: "Classroom",
      renderCell: (row) => (
        <div className="flex flex-col gap-1">
          {row.classroomName !== "Unassigned" ? (
            <>
              <Chip
                label={`${row.classroomName} (${row.classroomCode})`}
                size="small"
                className="bg-indigo-100 text-indigo-700"
              />
              <Typography variant="caption" className="text-gray-500">
                {row.classroomLocation && `📍 ${row.classroomLocation}`}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {row.classroomCapacity && row.classroomCapacity !== "N/A"
                  ? `👥 Cap: ${row.classroomCapacity}`
                  : ""}
              </Typography>
            </>
          ) : (
            <Chip
              label="Unassigned"
              size="small"
              className="bg-gray-100 text-gray-600"
            />
          )}
        </div>
      ),
    },
    { field: "clientName", headerName: "Client" },
    {
      field: "staff",
      headerName: "Staff",
      renderCell: (row) => (
        <Box className="flex gap-2">
          <Tooltip title="Trainers">
            <Chip
              icon={<PersonIcon className="text-xs" />}
              label={`${row.trainerCount} T`}
              size="small"
              className="bg-blue-100 text-blue-700"
            />
          </Tooltip>
          <Tooltip title="TAs">
            <Chip
              label={`${row.taCount} TA`}
              size="small"
              className="bg-orange-100 text-orange-700"
            />
          </Tooltip>
          <Tooltip title="Learners">
            <Chip
              label={`${row.learnerCount} L`}
              size="small"
              className="bg-green-100 text-green-700"
            />
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "progress",
      headerName: "Progress",
      renderCell: (row) => (
        <Box className="w-24">
          <LinearProgress
            variant="determinate"
            value={row.progress || 0}
            className="h-2 rounded-full"
          />
          <Typography variant="caption" className="text-gray-500">
            {row.progress || 0}%
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      renderCell: (row) => (
        <Chip
          label={row.status}
          size="small"
          className={getStatusColor(row.status)}
        />
      ),
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-generate code when department or client changes (only for new batches)
      if ((name === "department" || name === "clientName") && !editingId) {
        const deptId = name === "department" ? value : prev.department;
        const client = name === "clientName" ? value : prev.clientName;
        updated.code = generateCode(deptId, client);
      }
      return updated;
    });

    // If start date changes, refresh available trainers
    if (name === "startDate") {
      fetchAvailableStaff(editingId, value);
    }
  };

  const handleStaffChange = (event, field) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [field]: typeof value === "string" ? value.split(",") : value,
    }));
  };

  const handleOpenAdd = async () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      department: "",
      clientName: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "PLANNING",
      classroom: "",
      trainers: [],
      tas: [],
      learners: [],
    });
    setOpenModal(true);
    await fetchAvailableStaff(null, "");
  };

  const handleEdit = async (row) => {
    setEditingId(row._id || row.id);
    const startDate = row.startDate
      ? new Date(row.startDate).toISOString().split("T")[0]
      : "";
    setFormData({
      name: row.name,
      code: row.code || "",
      department: row.department?._id || row.department || "",
      clientName: row.clientName || "",
      description: row.description || "",
      startDate: startDate,
      endDate: row.endDate
        ? new Date(row.endDate).toISOString().split("T")[0]
        : "",
      status: row.status || "PLANNING",
      classroom: row.classroom?._id || row.classroom || "",
      trainers: row.trainers?.map((t) => t._id || t) || [],
      tas: row.tas?.map((t) => t._id || t) || [],
      learners: row.learners?.map((l) => l._id || l) || [],
    });
    setOpenModal(true);
    await fetchAvailableStaff(row._id || row.id, startDate);
  };

  const handleClose = () => {
    setOpenModal(false);
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      department: "",
      clientName: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "PLANNING",
      classroom: "",
      trainers: [],
      tas: [],
      learners: [],
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.code ||
      !formData.department ||
      !formData.clientName ||
      !formData.startDate ||
      !formData.endDate
    ) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    // Validate dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      showSnackbar("End date must be after start date", "error");
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        department: formData.department,
        clientName: formData.clientName,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,

        classroom: formData.classroom || null,
        trainers: formData.trainers,
        tas: formData.tas,
        learners: formData.learners,
      };

      if (editingId) {
        await batchesAPI.update(editingId, submitData);
        showSnackbar("Batch updated successfully");
      } else {
        await batchesAPI.create(submitData);
        showSnackbar("Batch created successfully");
      }

      handleClose();
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error saving batch:", error);
      showSnackbar(error.message || error || "Error saving batch", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(`Are you sure you want to cancel the batch "${row.name}"?`)
    ) {
      try {
        await batchesAPI.delete(row._id || row.id);
        showSnackbar("Batch cancelled successfully");
        fetchData(); // Refresh the list
      } catch (error) {
        console.error("Error deleting batch:", error);
        showSnackbar(error.message || "Error cancelling batch", "error");
      }
    }
  };

  // Get TA display name with warning for multiple assignments
  const getTADisplayName = (taId) => {
    const ta = availableTAs.find((t) => t._id === taId);
    if (!ta) return taId;
    return `${ta.firstName} ${ta.lastName}`;
  };

  const getTAWarning = (taId) => {
    const ta = availableTAs.find((t) => t._id === taId);
    if (!ta) return null;
    if (ta.assignedBatchCount > 0) {
      return `Already assigned to ${ta.assignedBatchCount} batch(es)`;
    }
    return null;
  };

  if (loading) {
    return (
      <Box className="min-h-96 flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-gray-800">
            Batches
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Manage training batches and their assignments
          </Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          className="bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30"
        >
          Add Batch
        </Button>
      </div>

      {/* Batch List */}
      <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100">
        <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
          Batch List
        </Typography>
        <DataTable
          columns={columns}
          data={batches}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Paper>

      {/* Add/Edit Batch Modal */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "rounded-2xl",
        }}
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <Typography variant="h6" className="font-semibold">
              {editingId ? "Edit Batch" : "Add New Batch"}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              {editingId
                ? "Update batch details and staff assignments"
                : "Create a new training batch"}
            </Typography>
          </div>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pt-6">
          <div className="space-y-4 mt-4">
            {/* Basic Info */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700"
            >
              Basic Information
            </Typography>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                name="name"
                label="Batch Name"
                placeholder="e.g. MERN Batch for LTI"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                name="code"
                label="Batch Code"
                placeholder="Auto-generated"
                value={formData.code}
                onChange={handleChange}
                required
                helperText={
                  !editingId ? "Auto-generated, but you can modify" : ""
                }
                InputProps={{
                  style: { textTransform: "uppercase" },
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                select
                name="department"
                label="Department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                name="clientName"
                label="Client Name"
                placeholder="e.g. LTI Mindtree"
                value={formData.clientName}
                onChange={handleChange}
                required
              />
            </div>
            <TextField
              fullWidth
              name="description"
              label="Description"
              placeholder="Enter batch description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
            <div className="grid grid-cols-3 gap-4">
              <TextField
                fullWidth
                name="startDate"
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                name="endDate"
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                select
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleChange}
              >
                <MenuItem value="PLANNING">Planning</MenuItem>
                <MenuItem value="ONGOING">Ongoing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </div>

            {/* Classroom Selection */}
            <div className="mt-4">
              <FormControl fullWidth>
                <InputLabel>Classroom (Optional)</InputLabel>
                <Select
                  name="classroom"
                  value={formData.classroom}
                  onChange={handleChange}
                  input={<OutlinedInput label="Classroom (Optional)" />}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {availableClassrooms.map((classroom) => {
                    const disabled = !classroom.isAvailable;
                    const availabilityText = disabled
                      ? `Unavailable (Occupied by ${classroom.currentBatchName})`
                      : `Capacity: ${classroom.capacity}`;

                    return (
                      <MenuItem
                        key={classroom._id}
                        value={classroom._id}
                        disabled={
                          disabled && formData.classroom !== classroom._id
                        }
                      >
                        <ListItemText
                          primary={`${classroom.name} (${classroom.code})`}
                          secondary={availabilityText}
                        />
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </div>

            {/* Staff Assignment Section */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mt-6 pt-4 border-t"
            >
              Staff Assignment
            </Typography>

            {loadingStaff ? (
              <Box className="flex items-center justify-center py-4">
                <CircularProgress size={24} />
                <Typography variant="body2" className="ml-2 text-gray-500">
                  Loading available staff...
                </Typography>
              </Box>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Trainers Selection */}
                <FormControl fullWidth>
                  <InputLabel id="trainers-label">Trainers</InputLabel>
                  <Select
                    labelId="trainers-label"
                    multiple
                    value={formData.trainers}
                    onChange={(e) => handleStaffChange(e, "trainers")}
                    input={<OutlinedInput label="Trainers" />}
                    renderValue={(selected) => (
                      <Box className="flex flex-wrap gap-1">
                        {selected.map((id) => {
                          const trainer = availableTrainers.find(
                            (t) => t._id === id,
                          );
                          return (
                            <Chip
                              key={id}
                              label={
                                trainer
                                  ? `${trainer.firstName} ${trainer.lastName}`
                                  : id
                              }
                              size="small"
                              className="bg-blue-100 text-blue-700"
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {availableTrainers.map((trainer) => {
                      const disabled = !trainer.isAvailable;
                      const availabilityText = disabled
                        ? `Unavailable (In ${trainer.currentBatchName} until ${new Date(trainer.currentBatchEndDate).toLocaleDateString()})`
                        : "";

                      return (
                        <MenuItem
                          key={trainer._id}
                          value={trainer._id}
                          disabled={
                            disabled &&
                            formData.trainers.indexOf(trainer._id) === -1
                          }
                        >
                          <Checkbox
                            checked={
                              formData.trainers.indexOf(trainer._id) > -1
                            }
                          />
                          <ListItemText
                            primary={`${trainer.firstName} ${trainer.lastName}`}
                            secondary={
                              disabled ? availabilityText : trainer.email
                            }
                            primaryTypographyProps={{
                              className: disabled ? "text-gray-400" : "",
                            }}
                          />
                        </MenuItem>
                      );
                    })}
                    {availableTrainers.length === 0 && (
                      <MenuItem disabled>
                        <em>No trainers found</em>
                      </MenuItem>
                    )}
                  </Select>
                  {!formData.startDate && (
                    <Typography
                      variant="caption"
                      className="text-orange-500 mt-1 block"
                    >
                      Please select a Start Date to see accurate trainer
                      availability.
                    </Typography>
                  )}
                </FormControl>

                {/* TAs Selection */}
                <FormControl fullWidth>
                  <InputLabel id="tas-label">
                    Teaching Assistants (TAs)
                  </InputLabel>
                  <Select
                    labelId="tas-label"
                    multiple
                    value={formData.tas}
                    onChange={(e) => handleStaffChange(e, "tas")}
                    input={<OutlinedInput label="Teaching Assistants (TAs)" />}
                    renderValue={(selected) => (
                      <Box className="flex flex-wrap gap-1">
                        {selected.map((id) => {
                          const ta = availableTAs.find((t) => t._id === id);
                          const warning = getTAWarning(id);
                          return (
                            <Chip
                              key={id}
                              label={ta ? `${ta.firstName} ${ta.lastName}` : id}
                              size="small"
                              className={
                                warning
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }
                              icon={
                                warning ? (
                                  <WarningIcon className="text-orange-500 text-sm" />
                                ) : undefined
                              }
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {availableTAs.map((ta) => {
                      const hasMultiple = ta.assignedBatchCount > 0;
                      return (
                        <MenuItem
                          key={ta._id}
                          value={ta._id}
                          className={hasMultiple ? "bg-orange-50" : ""}
                        >
                          <Checkbox
                            checked={formData.tas.indexOf(ta._id) > -1}
                          />
                          <ListItemText
                            primary={
                              <Box className="flex items-center gap-2">
                                {`${ta.firstName} ${ta.lastName}`}
                                {hasMultiple && (
                                  <Tooltip
                                    title={`Currently assigned to: ${ta.assignedBatches.map((b) => b.name).join(", ")}`}
                                  >
                                    <WarningIcon className="text-orange-500 text-sm" />
                                  </Tooltip>
                                )}
                              </Box>
                            }
                            secondary={
                              hasMultiple
                                ? `${ta.email} • Assigned to ${ta.assignedBatchCount} batch(es)`
                                : ta.email
                            }
                          />
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <Typography variant="caption" className="text-gray-500 mt-1">
                    TAs can be assigned to multiple batches (shown with ⚠️
                    warning)
                  </Typography>
                </FormControl>
              </div>
            )}

            {/* Learners Selection Section */}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 mt-6 pt-4 border-t"
            >
              Learner Enrollment
            </Typography>
            {loadingStaff ? (
              <Typography variant="body2" className="text-gray-500">
                Loading learners...
              </Typography>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="learners-label">Learners</InputLabel>
                <Select
                  labelId="learners-label"
                  multiple
                  value={formData.learners}
                  onChange={(e) => handleStaffChange(e, "learners")}
                  input={<OutlinedInput label="Learners" />}
                  renderValue={(selected) => (
                    <Box className="flex flex-wrap gap-1">
                      <Chip
                        label={`${selected.length} Learners Selected`}
                        size="small"
                        className="bg-green-100 text-green-700"
                      />
                    </Box>
                  )}
                  MenuProps={MenuProps}
                >
                  {availableLearners.map((learner) => {
                    const disabled = !learner.isAvailable;
                    const availabilityText = disabled
                      ? `Unavailable (In ${learner.currentBatchName} until ${new Date(learner.currentBatchEndDate).toLocaleDateString()})`
                      : "";

                    return (
                      <MenuItem
                        key={learner._id}
                        value={learner._id}
                        disabled={
                          disabled &&
                          formData.learners.indexOf(learner._id) === -1
                        }
                      >
                        <Checkbox
                          checked={formData.learners.indexOf(learner._id) > -1}
                        />
                        <ListItemText
                          primary={`${learner.firstName} ${learner.lastName} (${learner.email})`}
                          secondary={disabled ? availabilityText : null}
                          primaryTypographyProps={{
                            className: disabled ? "text-gray-400" : "",
                          }}
                        />
                      </MenuItem>
                    );
                  })}
                  {availableLearners.length === 0 && (
                    <MenuItem disabled>
                      <em>No learners found</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {/* Warning for TAs with multiple assignments */}
            {formData.tas.some((id) => getTAWarning(id)) && (
              <Alert severity="warning" className="mt-4">
                <Typography variant="body2">
                  <strong>Note:</strong> Some selected TAs are already assigned
                  to other batches:
                </Typography>
                <ul className="list-disc ml-4 mt-1">
                  {formData.tas
                    .filter((id) => getTAWarning(id))
                    .map((id) => {
                      const ta = availableTAs.find((t) => t._id === id);
                      return (
                        <li key={id}>
                          {ta?.firstName} {ta?.lastName}:{" "}
                          {ta?.assignedBatches?.map((b) => b.name).join(", ")}
                        </li>
                      );
                    })}
                </ul>
              </Alert>
            )}
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={handleClose} className="text-gray-600">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !formData.name ||
              !formData.department ||
              !formData.clientName ||
              !formData.startDate ||
              !formData.endDate ||
              submitting
            }
            className="bg-primary-500 hover:bg-primary-600"
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : editingId ? (
              "Update Batch"
            ) : (
              "Create Batch"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Batches;

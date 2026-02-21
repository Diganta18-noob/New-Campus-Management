import { useState, useEffect, useRef } from "react";
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
  Alert,
  Snackbar,
  CircularProgress,
  Box,
  Chip,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { usersAPI, departmentsAPI } from "../../services/api";

const ROLES = ["ADMIN", "MANAGER", "TEAM_LEADER", "TRAINER", "TA", "LEARNER"];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const fileInputRef = useRef(null);
  const [cohortOptions, setCohortOptions] = useState([]);

  // Filter states
  const [selectedRole, setSelectedRole] = useState("LEARNER");
  const [searchText, setSearchText] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    phone: "",
    rollNumber: "",
    cohortId: "",
    department: "",
    role: "LEARNER",
  });

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 180,
      renderCell: (params) => `${params.row.firstName} ${params.row.lastName}`,
    },
    { field: "email", headerName: "Email", width: 200 },
    { field: "username", headerName: "Username", width: 130 },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.role}
          size="small"
          color={
            params.row.role === "ADMIN"
              ? "error"
              : params.row.role === "MANAGER"
                ? "warning"
                : "default"
          }
        />
      ),
    },
    {
      field: "rollNumber",
      headerName: "Roll Number",
      width: 130,
    },
    {
      field: "cohortId",
      headerName: "Cohort",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.cohortId || "N/A"}
          size="small"
          variant={params.row.cohortId ? "filled" : "outlined"}
          className={params.row.cohortId ? "bg-cyan-100 text-cyan-700" : ""}
        />
      ),
    },
    { field: "phone", headerName: "Phone", width: 130 },
    {
      field: "isActive",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? "Active" : "Inactive"}
          size="small"
          color={params.row.isActive ? "success" : "default"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box className="flex gap-2">
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row)}
            title="Deactivate"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        usersAPI.getAll({ limit: 1000 }),
        departmentsAPI.getAll(),
      ]);

      const allUsers = (usersRes.data || []).map((user, index) => ({
        ...user,
        id: user._id,
      }));

      setUsers(allUsers);
      setDepartments(deptsRes.data || []);

      // Extract unique cohorts
      const cohorts = new Set();
      allUsers.forEach((user) => {
        if (user.cohortId) {
          cohorts.add(user.cohortId);
        }
      });
      setCohortOptions(Array.from(cohorts).sort());
    } catch (error) {
      console.error("Error fetching data:", error);
      showSnackbar(error.message || "Error fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on role and search text
  const getFilteredUsers = () => {
    return users.filter((user) => {
      const roleMatch = selectedRole === "ALL" || user.role === selectedRole;

      const searchLower = searchText.toLowerCase();
      const searchMatch =
        !searchText ||
        `${user.firstName} ${user.lastName}`
          .toLowerCase()
          .includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.cohortId && user.cohortId.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower));

      return roleMatch && searchMatch;
    });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      phone: "",
      rollNumber: "",
      cohortId: "",
      department: "",
      role: selectedRole === "ALL" ? "LEARNER" : selectedRole,
    });
    setOpenModal(true);
  };

  const handleEdit = (row) => {
    setEditingId(row._id || row.id);
    setFormData({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      username: row.username,
      phone: row.phone || "",
      rollNumber: row.rollNumber || "",
      cohortId: row.cohortId || "",
      department: row.department || "",
      role: row.role,
    });
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.username
    ) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await usersAPI.update(editingId, formData);
        showSnackbar("User updated successfully");
      } else {
        await usersAPI.create(formData);
        showSnackbar("User created successfully");
      }
      handleClose();
      fetchData();
    } catch (error) {
      console.error("Error saving user:", error);
      showSnackbar(error.message || "Error saving user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (
      window.confirm(
        `Are you sure you want to deactivate "${row.firstName} ${row.lastName}"?`,
      )
    ) {
      try {
        await usersAPI.updateStatus(row._id || row.id, false);
        showSnackbar("User deactivated successfully");
        fetchData();
      } catch (error) {
        showSnackbar("Error deactivating user", "error");
      }
    }
  };

  // CSV Upload Handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        showSnackbar("CSV file is empty or invalid", "error");
        return;
      }

      const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim());

      const usersToImport = [];
      const uniqueCohorts = new Set();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < 3) continue;

        const user = {
          role: selectedRole === "ALL" ? "LEARNER" : selectedRole,
        };

        headers.forEach((header, index) => {
          if (header.includes("first")) user.firstName = values[index];
          else if (header.includes("last")) user.lastName = values[index];
          else if (header === "email") user.email = values[index];
          else if (header.includes("roll")) user.rollNumber = values[index];
          else if (header === "phone") user.phone = values[index];
          else if (header === "username") user.username = values[index];
          else if (header.includes("cohort")) user.cohortId = values[index];
        });

        if (user.firstName && user.email) {
          if (!user.username) {
            user.username = user.email.split("@")[0];
          }
          if (!user.lastName) user.lastName = ".";

          if (user.cohortId) {
            uniqueCohorts.add(user.cohortId);
          }

          usersToImport.push(user);
        }
      }

      if (usersToImport.length === 0) {
        showSnackbar("No valid records found in CSV", "error");
        return;
      }

      try {
        setLoading(true);
        const res = await usersAPI.bulkCreate({ users: usersToImport });
        const cohortInfo =
          uniqueCohorts.size > 0
            ? ` (${uniqueCohorts.size} cohort group(s))`
            : "";
        showSnackbar(
          res.message ||
            `Successfully imported ${usersToImport.length} users${cohortInfo}!`,
        );
        fetchData();
      } catch (error) {
        console.error("Import error:", error);
        showSnackbar(error.message || "Error importing users", "error");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "firstname,lastname,email,rollnumber,phone,cohortid\nJohn,Doe,john@example.com,J001,1234567890,BATCH-2025-A\nJane,Smith,jane@example.com,J002,9876543210,BATCH-2025-A\nMark,Wilson,mark@example.com,J003,5555555555,BATCH-2025-B";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_bulk_import_template.csv";
    a.click();
  };

  if (loading && !users.length) {
    return (
      <Box className="min-h-96 flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = getFilteredUsers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" className="font-bold text-gray-800">
            Users Management
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Manage all system users and their roles
          </Typography>
        </div>
        <div className="flex gap-2">
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            className="text-gray-600"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            className="bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30"
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Bulk Import Section */}
      <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold text-gray-800">
            Bulk Import Users
          </Typography>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            className="text-primary-500"
          >
            Download Template CSV
          </Button>
        </div>

        <Alert severity="info" className="mb-4 rounded-lg">
          <Typography variant="body2" className="mb-2">
            <strong>CSV Format:</strong> firstname, lastname, email, rollnumber,
            phone, cohortid
          </Typography>
          <Typography variant="body2" className="text-gray-700">
            Use <strong>cohortid</strong> to group users for easy batch
            assignment. Currently selected role: <strong>{selectedRole}</strong>
          </Typography>
        </Alert>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-300 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="text-gray-400 text-5xl mb-3" />
          <Typography variant="body1" className="text-gray-600 mb-1">
            Drag and drop your CSV file here
          </Typography>
          <Typography variant="body2" className="text-gray-400">
            or click to browse
          </Typography>
        </div>
      </Paper>

      {/* Users Directory with Filters */}
      <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100">
        <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
          Users Directory ({filteredUsers.length} of {users.length} users)
        </Typography>

        {/* Filter and Search Bar */}
        <div className="mb-4 flex gap-4 items-end">
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              label="Filter by Role"
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              {ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            placeholder="Search by name, email, or cohort ID..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-gray-400" />
                </InputAdornment>
              ),
            }}
          />
        </div>

        {/* Data Grid */}
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25, 50]}
            disableSelectionOnClick
            disableColumnMenu
            sx={{
              "& .MuiDataGrid-root": {
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
              },
              "& .MuiDataGrid-cell": {
                borderColor: "#f0f0f0",
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
                borderColor: "#e0e0e0",
              },
            }}
          />
        </div>
      </Paper>

      {/* Add/Edit User Modal */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "rounded-2xl",
        }}
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <Typography variant="h6" className="font-semibold">
              {editingId ? "Edit User" : "Add New User"}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              {editingId ? "Update user details" : "Create a user account"}
            </Typography>
          </div>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                placeholder="e.g. John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                placeholder="e.g. Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <TextField
              fullWidth
              name="email"
              label="Email"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              name="username"
              label="Username"
              placeholder="e.g. johndoe"
              value={formData.username}
              onChange={handleChange}
              required
            />

            {!editingId && (
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              name="phone"
              label="Phone Number"
              placeholder="e.g. +1234567890"
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              name="rollNumber"
              label="Roll Number (Optional)"
              placeholder="e.g. S001, J001, etc."
              value={formData.rollNumber}
              onChange={handleChange}
            />
            <Autocomplete
              fullWidth
              freeSolo
              options={cohortOptions}
              value={formData.cohortId}
              onChange={(event, newValue) => {
                setFormData({ ...formData, cohortId: newValue || "" });
              }}
              inputValue={formData.cohortId}
              onInputChange={(event, newInputValue) => {
                setFormData({ ...formData, cohortId: newInputValue });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cohort ID (Optional)"
                  placeholder="e.g. BATCH-2025-A or select existing"
                  helperText="Search existing cohorts or create a new one"
                />
              )}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-6 pt-0">
          <Button onClick={handleClose} className="text-gray-600">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : editingId ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          className="rounded-xl"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UsersManagement;

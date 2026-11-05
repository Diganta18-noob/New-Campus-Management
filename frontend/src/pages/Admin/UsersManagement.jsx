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
import { parseCsv } from "../../utils/csvImport";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const ROLES = ["ADMIN", "MANAGER", "TEAM_LEADER", "TRAINER", "TA", "LEARNER"];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [temporaryCredentials, setTemporaryCredentials] = useState([]);
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

  useEffect(() => { const timer = setTimeout(fetchData, 250); return () => clearTimeout(timer); }, [selectedRole, searchText, paginationModel.page, paginationModel.pageSize]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        usersAPI.getAll({ page: paginationModel.page + 1, limit: paginationModel.pageSize, ...(selectedRole !== 'ALL' && { role: selectedRole }), search: searchText }),
        departmentsAPI.getAll(),
      ]);

      const allUsers = (usersRes.data || []).map((user, index) => ({
        ...user,
        id: user._id,
      }));

      setUsers(allUsers);
      setTotalUsers(usersRes.total || 0);
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
  const downloadCredentials = credentials => {
    const cell = value => `"${String(value || '').replace(/^[=+@\-]/, "'$&").replaceAll('"', '""')}\"`;
    const csv = ['email,temporaryPassword', ...credentials.map(row => `${cell(row.email)},${cell(row.temporaryPassword)}`)].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'temporary-credentials.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        const result = await usersAPI.create(formData);
        if (result.temporaryPassword) setTemporaryCredentials([{ email: formData.email, temporaryPassword: result.temporaryPassword }]);
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

  const handleDelete = (row) => setUserToDeactivate(row);
  const confirmDeactivate = async () => {
    const row = userToDeactivate;
    if (row) {
      try {
        await usersAPI.updateStatus(row._id || row.id, false);
        setUserToDeactivate(null);
        showSnackbar("User deactivated successfully");
        fetchData();
      } catch (error) {
        showSnackbar("Error deactivating user", "error");
      }
    }
  };

  // Validate CSV rows before sending them to the server.
  const parseRows = (headers, rows) => {
    const usersToImport = [];
    const uniqueCohorts = new Set();

    for (const [index, row] of rows.entries()) {
      const user = {
        role: "LEARNER",
      };

      headers.forEach((header, index) => {
        const value = (row[index] || '').toString().trim();

        if (header.includes("first")) user.firstName = value;
        else if (header.includes("last")) user.lastName = value;
        else if (header === "email") user.email = value;
        else if (header.includes("roll")) user.rollNumber = value;
        else if (header === "phone") user.phone = value;
        else if (header === "username") user.username = value;
        else if (header.includes("cohort")) user.cohortId = value;
      });

      if (user.firstName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email || '')) {
        if (!user.username) {
          user.username = user.email.split("@")[0];
        }
        if (!user.lastName) user.lastName = ".";
        if (user.cohortId) {
          uniqueCohorts.add(user.cohortId);
        }
        usersToImport.push(user);
      } else throw new Error(`CSV row ${index + 2} needs a first name and valid email`);
    }
    return { usersToImport, uniqueCohorts };
  };

  const importUsers = async (usersToImport, uniqueCohorts) => {
    if (usersToImport.length === 0) {
      showSnackbar("No valid records found in file", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await usersAPI.bulkCreate({ users: usersToImport });
      if (res.data?.temporaryCredentials?.length) setTemporaryCredentials(res.data.temporaryCredentials);
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

  // CSV upload with quoted-field and size validation.
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { showSnackbar('Save the spreadsheet as CSV before importing', 'error'); return; }
    if (file.size > 2_000_000) { showSnackbar('CSV file must be under 2 MB', 'error'); return; }
    file.text().then(async text => {
      const { headers, rows } = parseCsv(text);
      const { usersToImport, uniqueCohorts } = parseRows(headers, rows);
      await importUsers(usersToImport, uniqueCohorts);
    }).catch(error => showSnackbar(error.message || 'Could not read CSV', 'error'));
    event.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const csv = 'firstname,lastname,email,rollnumber,phone,cohortid\r\nJohn,Doe,john@example.com,J001,1234567890,BATCH-2025-A\r\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'users_bulk_import_template.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading && !users.length) {
    return (
      <Box className="min-h-96 flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  const filteredUsers = users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Users Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
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
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <div className="flex items-center justify-between mb-4">
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Bulk Import Learners
          </Typography>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            className="text-primary-500"
          >
            Download Template (.csv)
          </Button>
        </div>

        <Alert severity="info" className="mb-4 rounded-lg">
          <Typography variant="body2" className="mb-2">
            <strong>Accepted format:</strong> CSV (.csv), up to 500 learners
          </Typography>
          <Typography variant="body2" className="mb-2">
            <strong>Columns:</strong> firstname, lastname, email, rollnumber,
            phone, cohortid
          </Typography>
          <Typography variant="body2" className="text-gray-700">
            Use <strong>cohortid</strong> to group users for easy batch
            assignment. This import creates learner accounts.
            Unique temporary passwords will be shown once after import. Download and share them securely.
          </Typography>
        </Alert>

        <Button component="label" variant="outlined" startIcon={<UploadIcon />} fullWidth sx={{ minHeight: 96, borderStyle: 'dashed' }}>
          Select learner CSV file
          <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} hidden />
        </Button>
      </Paper>

      {/* Users Directory with Filters */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          Users Directory ({totalUsers} users)
        </Typography>

        {/* Filter and Search Bar */}
        <div className="mb-4 flex gap-4 items-end">
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value); setPaginationModel(model => ({ ...model, page: 0 })); }}
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
            onChange={(e) => { setSearchText(e.target.value); setPaginationModel(model => ({ ...model, page: 0 })); }}
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
            rowCount={totalUsers}
            paginationMode="server"
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

      <Dialog open={temporaryCredentials.length > 0} onClose={() => setTemporaryCredentials([])} fullWidth maxWidth="sm">
        <DialogTitle>Temporary credentials</DialogTitle>
        <DialogContent><Alert severity="warning" sx={{ mb: 2 }}>These passwords are shown only now. Share each one securely; users must change it on first sign-in.</Alert>
          {temporaryCredentials.length === 1 && <TextField fullWidth label={temporaryCredentials[0].email} value={temporaryCredentials[0].temporaryPassword} InputProps={{ readOnly: true }} />}
          {temporaryCredentials.length > 1 && <Typography>{temporaryCredentials.length} accounts created. Download the one-time credentials file.</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => downloadCredentials(temporaryCredentials)}>Download CSV</Button><Button onClick={() => setTemporaryCredentials([])}>Done</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={Boolean(userToDeactivate)} title="Deactivate user" message={`Deactivate "${userToDeactivate?.firstName || ''} ${userToDeactivate?.lastName || ''}"?`} confirmLabel="Deactivate" isDangerous onCancel={() => setUserToDeactivate(null)} onConfirm={confirmDeactivate} />
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

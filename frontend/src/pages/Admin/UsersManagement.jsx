import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
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
import { usersAPI } from "../../services/api";
import { parseCsv } from "../../utils/csvImport";
import { directoryOptions } from "../../utils/peopleDirectoryQuery";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const ROLES = ["ADMIN", "MANAGER", "TEAM_LEADER", "TRAINER", "TA", "LEARNER"];

const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [temporaryCredentials, setTemporaryCredentials] = useState([]);

  // Filter states
  const [selectedRole, setSelectedRole] = useState("LEARNER");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300); return () => clearTimeout(timer); }, [searchText]);
  const directoryQuery = useQuery(directoryOptions({ role: selectedRole, search: debouncedSearch, page: paginationModel.page + 1, limit: paginationModel.pageSize }));
  const users = directoryQuery.data?.data || [];
  const totalUsers = directoryQuery.data?.total || 0;
  const cohortOptions = [...new Set(users.map(user => user.cohortId).filter(Boolean))].sort();
  const fetchData = () => queryClient.invalidateQueries({ queryKey: ['people-directory'] });

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
      setImporting(true);
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
      setImporting(false);
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

        <Button component="label" variant="outlined" startIcon={importing ? <CircularProgress size={18} /> : <UploadIcon />} disabled={importing} fullWidth sx={{ minHeight: 96, borderStyle: 'dashed' }}>
          {importing ? 'Importing learners…' : 'Select learner CSV file'}
          <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} disabled={importing} hidden />
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
            label="Search people"
            placeholder="Name, email, or username"
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

        {directoryQuery.isFetching && <Typography variant="body2" role="status" sx={{ mb: 1, color: 'text.secondary' }}>{directoryQuery.isPending ? 'Loading people…' : 'Updating directory…'}</Typography>}
        {directoryQuery.isError && <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={() => directoryQuery.refetch()}>Retry</Button>}>Could not load the people directory.</Alert>}
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1120 }}>
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Username</TableCell><TableCell>Role</TableCell><TableCell>Roll number</TableCell><TableCell>Cohort</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {users.map(row => <TableRow key={row._id} hover>
                <TableCell sx={{ fontWeight: 650 }}>{row.firstName} {row.lastName}</TableCell>
                <TableCell>{row.email}</TableCell><TableCell>{row.username}</TableCell>
                <TableCell><Chip size="small" label={row.role} color={row.role === 'ADMIN' ? 'error' : row.role === 'MANAGER' ? 'warning' : 'default'} /></TableCell>
                <TableCell>{row.rollNumber || '—'}</TableCell><TableCell><Chip size="small" label={row.cohortId || 'N/A'} variant={row.cohortId ? 'filled' : 'outlined'} /></TableCell>
                <TableCell>{row.phone || '—'}</TableCell><TableCell><Chip size="small" label={row.isActive ? 'Active' : 'Inactive'} color={row.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell><Stack direction="row" gap={0.5}><IconButton size="small" aria-label={`Edit ${row.firstName} ${row.lastName}`} onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" color="error" aria-label={`Deactivate ${row.firstName} ${row.lastName}`} onClick={() => handleDelete(row)}><DeleteIcon fontSize="small" /></IconButton></Stack></TableCell>
              </TableRow>)}
              {!users.length && !directoryQuery.isPending && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>{directoryQuery.isError ? 'Directory unavailable.' : 'No people match these filters.'}</TableCell></TableRow>}
              {directoryQuery.isPending && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 5 }}><CircularProgress size={22} aria-label="Loading people" /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={totalUsers} page={paginationModel.page} rowsPerPage={paginationModel.pageSize} rowsPerPageOptions={[5, 10, 25, 50]} onPageChange={(_, page) => setPaginationModel(model => ({ ...model, page }))} onRowsPerPageChange={event => setPaginationModel({ page: 0, pageSize: Number(event.target.value) })} />
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

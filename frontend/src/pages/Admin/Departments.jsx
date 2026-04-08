import { useState, useEffect } from 'react'
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
    Chip,
    Alert,
    Snackbar,
    CircularProgress,
    Box,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import DataTable from '../../components/ui/DataTable'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { departmentsAPI } from '../../services/api'

const Departments = () => {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [filterStatus, setFilterStatus] = useState('ACTIVE')
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
    })
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        row: null,
        loading: false,
    })

    // Fetch departments on component mount
    useEffect(() => {
        fetchDepartments()
    }, [])

    const fetchDepartments = async () => {
        try {
            setLoading(true)
            const response = await departmentsAPI.getAll({ limit: 100 })
            // Transform data for DataTable (use _id as id)
            const transformedData = (response.data || []).map(dept => ({
                ...dept,
                id: dept._id,
                students: dept.batchCount || 0
            }))
            setDepartments(transformedData)
        } catch (error) {
            console.error('Error fetching departments:', error)
            showSnackbar(error.message || 'Error fetching departments', 'error')
        } finally {
            setLoading(false)
        }
    }

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity })
    }

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    // Generate code directly from the department name
    const generateCode = (name) => {
        if (!name) return ''
        return name.trim().toUpperCase().replace(/\s+/g, '_')
    }

    const columns = [
        { field: 'name', headerName: 'Department Name' },
        {
            field: 'code',
            headerName: 'Code',
            renderCell: (row) => (
                <span className="font-mono text-gray-700 uppercase">
                    {row.code?.toUpperCase()}
                </span>
            ),
        },
        {
            field: 'description',
            headerName: 'Description',
            renderCell: (row) => (
                <span className="text-gray-600">
                    {row.description || '-'}
                </span>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            renderCell: (row) => (
                <Chip
                    label={row.status || 'ACTIVE'}
                    size="small"
                    color={row.status === 'ACTIVE' ? 'success' : 'default'}
                    className={row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                />
            ),
        },
    ]

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => {
            const updated = { ...prev, [name]: value }
            // Auto-generate code when name changes (only for new departments)
            if (name === 'name' && !editingId) {
                updated.code = generateCode(value)
            }
            return updated
        })
    }

    const handleOpenAdd = () => {
        setEditingId(null)
        setFormData({ name: '', code: '', description: '' })
        setOpenModal(true)
    }

    const handleEdit = (row) => {
        setEditingId(row._id || row.id)
        setFormData({
            name: row.name,
            code: row.code || '',
            description: row.description || ''
        })
        setOpenModal(true)
    }

    const handleClose = () => {
        setOpenModal(false)
        setEditingId(null)
        setFormData({ name: '', code: '', description: '' })
    }

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) {
            showSnackbar('Name and code are required', 'error')
            return
        }

        try {
            setSubmitting(true)
            const submitData = {
                name: formData.name,
                code: formData.code.toUpperCase(),
                description: formData.description,
            }

            if (editingId) {
                await departmentsAPI.update(editingId, submitData)
                showSnackbar('Department updated successfully')
            } else {
                await departmentsAPI.create(submitData)
                showSnackbar('Department created successfully')
            }
            
            handleClose()
            fetchDepartments() // Refresh the list
        } catch (error) {
            console.error('Error saving department:', error)
            showSnackbar(error.message || 'Error saving department', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = (row) => {
        setConfirmDialog({ open: true, row, loading: false })
    }

    const confirmDelete = async () => {
        const row = confirmDialog.row
        if (!row) return
        try {
            setConfirmDialog(prev => ({ ...prev, loading: true }))
            await departmentsAPI.delete(row._id || row.id)
            showSnackbar('Department deactivated successfully')
            fetchDepartments()
        } catch (error) {
            console.error('Error deleting department:', error)
            showSnackbar(error.message || 'Error deleting department', 'error')
        } finally {
            setConfirmDialog({ open: false, row: null, loading: false })
        }
    }

    if (loading) {
        return (
            <Box className="min-h-96 flex items-center justify-center">
                <CircularProgress />
            </Box>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Departments
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Manage your academic departments
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                    className="bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30"
                >
                    Add Department
                </Button>
            </div>

            {/* Department List */}
            <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Department List
                    </Typography>
                    <ToggleButtonGroup
                        value={filterStatus}
                        exclusive
                        onChange={(e, val) => { if (val !== null) setFilterStatus(val) }}
                        size="small"
                    >
                        <ToggleButton value="ACTIVE" sx={{ textTransform: 'none', px: 2 }}>
                            Active
                        </ToggleButton>
                        <ToggleButton value="INACTIVE" sx={{ textTransform: 'none', px: 2 }}>
                            Inactive
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
                <DataTable
                    columns={columns}
                    data={departments.filter(d => (d.status || 'ACTIVE') === filterStatus)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </Paper>

            {/* Add/Edit Department Modal */}
            <Dialog
                open={openModal}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    className: 'rounded-2xl',
                }}
            >
                <DialogTitle className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <Typography variant="h6" className="font-semibold">
                            {editingId ? 'Edit Department' : 'Add New Department'}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                            {editingId ? 'Update department details' : 'Create a new academic department'}
                        </Typography>
                    </div>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="pt-6">
                    <div className="space-y-4 mt-4">
                        <TextField
                            fullWidth
                            name="name"
                            label="Department Name"
                            placeholder="e.g. MERN Stack"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            name="code"
                            label="Department Code"
                            placeholder="e.g. MERN1DEC25"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            helperText={!editingId ? "Auto-generated based on name, but you can modify it" : ""}
                            InputProps={{
                                style: { textTransform: 'uppercase' }
                            }}
                        />
                        <TextField
                            fullWidth
                            name="description"
                            label="Description"
                            placeholder="Enter department description"
                            value={formData.description}
                            onChange={handleChange}
                            multiline
                            rows={3}
                        />
                    </div>
                </DialogContent>
                <DialogActions className="p-6 pt-0">
                    <Button
                        onClick={handleClose}
                        className="text-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!formData.name || !formData.code || submitting}
                        className="bg-primary-500 hover:bg-primary-600"
                    >
                        {submitting ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            editingId ? 'Update Department' : 'Create Department'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog({ open: false, row: null, loading: false })}
                onConfirm={confirmDelete}
                title="Delete Department"
                message={`Are you sure you want to deactivate "${confirmDialog.row?.name || ''}"? This will mark the department as inactive.`}
                confirmText="Delete"
                severity="error"
                loading={confirmDialog.loading}
            />

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    )
}

export default Departments

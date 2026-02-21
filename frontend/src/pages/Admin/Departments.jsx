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
} from '@mui/material'
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material'
import DataTable from '../../components/ui/DataTable'
import { departmentsAPI } from '../../services/api'

const Departments = () => {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
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

    // Generate unique code: coursebatchMonthYear (e.g., mern1dec25, azure1feb26)
    const generateCode = (name) => {
        if (!name) return ''
        const date = new Date()
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        const month = monthNames[date.getMonth()]
        const year = String(date.getFullYear()).slice(-2)
        // Extract course abbreviation from name (first word, lowercase)
        const courseCode = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
        // Count existing batches with same course to get batch number
        const existingBatches = departments.filter(d =>
            d.code?.toLowerCase().startsWith(courseCode)
        ).length
        const batchNum = existingBatches + 1
        return `${courseCode}${batchNum}${month}${year}`.toUpperCase()
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

    const handleDelete = async (row) => {
        if (window.confirm(`Are you sure you want to delete "${row.name}"?`)) {
            try {
                await departmentsAPI.delete(row._id || row.id)
                showSnackbar('Department deleted successfully')
                fetchDepartments() // Refresh the list
            } catch (error) {
                console.error('Error deleting department:', error)
                showSnackbar(error.message || 'Error deleting department', 'error')
            }
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
                    <Typography variant="h4" className="font-bold text-gray-800">
                        Departments
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1">
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
                className="p-6 rounded-2xl border border-gray-100"
            >
                <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
                    Department List
                </Typography>
                <DataTable
                    columns={columns}
                    data={departments}
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

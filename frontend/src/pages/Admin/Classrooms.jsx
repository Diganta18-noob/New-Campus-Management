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
    MenuItem,
    Chip,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Box
} from '@mui/material'
import { Add as AddIcon, Close as CloseIcon, LocationOn as LocationIcon } from '@mui/icons-material'
import DataTable from '../../components/ui/DataTable'
import { classroomsAPI } from '../../services/api'

const FACILITIES = ['PROJECTOR', 'WHITEBOARD', 'AC', 'WIFI', 'SOUND_SYSTEM', 'COMPUTERS']

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
}

const Classrooms = () => {
    const [classrooms, setClassrooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: '',
        capacity: '',
        facilities: [],
        isActive: true
    })
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    })

    useEffect(() => {
        fetchClassrooms()
    }, [])

    const fetchClassrooms = async () => {
        try {
            setLoading(true)
            const response = await classroomsAPI.getAll()
            const transformedData = (response.data || []).map(item => ({
                ...item,
                id: item._id
            }))
            setClassrooms(transformedData)
        } catch (error) {
            console.error('Error fetching classrooms:', error)
            showSnackbar('Error fetching classrooms', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFacilitiesChange = (event) => {
        const {
            target: { value },
        } = event
        setFormData(prev => ({
            ...prev,
            facilities: typeof value === 'string' ? value.split(',') : value,
        }))
    }

    const handleOpenAdd = () => {
        setEditingId(null)
        setFormData({
            name: '',
            code: '',
            location: '',
            capacity: '',
            facilities: [],
            isActive: true
        })
        setOpenModal(true)
    }

    const handleEdit = (row) => {
        setEditingId(row._id)
        setFormData({
            name: row.name,
            code: row.code,
            location: row.location,
            capacity: row.capacity,
            facilities: row.facilities || [],
            isActive: row.isActive
        })
        setOpenModal(true)
    }

    const handleClose = () => {
        setOpenModal(false)
        setEditingId(null)
    }

    const handleSubmit = async () => {
        try {
            if (!formData.name || !formData.code || !formData.location || !formData.capacity) {
                showSnackbar('Please fill all required fields', 'error')
                return
            }

            if (editingId) {
                await classroomsAPI.update(editingId, formData)
                showSnackbar('Classroom updated successfully')
            } else {
                await classroomsAPI.create(formData)
                showSnackbar('Classroom created successfully')
            }
            handleClose()
            fetchClassrooms()
        } catch (error) {
            console.error('Error saving classroom:', error)
            showSnackbar(error.response?.data?.message || 'Error saving classroom', 'error')
        }
    }

    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity })
    }

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const columns = [
        { field: 'name', headerName: 'Name', flex: 1 },
        { 
            field: 'code', 
            headerName: 'Code', 
            flex: 1,
            renderCell: (row) => (
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
                    {row.code}
                </span>
            )
        },
        { 
            field: 'location', 
            headerName: 'Location', 
            flex: 1,
            renderCell: (row) => (
                <div className="flex items-center text-gray-600">
                    <LocationIcon className="text-sm mr-1" />
                    {row.location}
                </div>
            )
        },
        { 
            field: 'capacity', 
            headerName: 'Capacity', 
            width: 100,
            renderCell: (row) => (
                <div className="flex items-center justify-center w-full">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {row.capacity} Seats
                    </span>
                </div>
            )
        },
        {
            field: 'facilities',
            headerName: 'Facilities',
            flex: 1.5,
            renderCell: (row) => (
                <div className="flex gap-1 flex-wrap">
                    {row.facilities?.slice(0, 3).map((f) => (
                        <Chip key={f} label={f} size="small" className="text-[10px] h-5" />
                    ))}
                    {row.facilities?.length > 3 && (
                        <Chip label={`+${row.facilities.length - 3}`} size="small" className="text-[10px] h-5 bg-gray-100" />
                    )}
                </div>
            )
        },
        {
            field: 'isActive',
            headerName: 'Status',
            width: 120,
            renderCell: (row) => (
                <Chip
                    label={row.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={row.isActive ? 'success' : 'default'}
                    className={row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                />
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Typography variant="h4" className="font-bold text-gray-800">
                        Classrooms
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-1">
                        Manage campus classrooms and facilities
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenAdd}
                    className="bg-primary-500 hover:bg-primary-600"
                >
                    Add Classroom
                </Button>
            </div>

            <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100">
                <DataTable
                    columns={columns}
                    data={classrooms}
                    onEdit={handleEdit}
                    loading={loading}
                />
            </Paper>

            <Dialog 
                open={openModal} 
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle className="flex justify-between items-center border-b pb-4">
                    <Typography variant="h6" className="font-semibold">
                        {editingId ? 'Edit Classroom' : 'Add New Classroom'}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent className="pt-6">
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Lab 1"
                                fullWidth
                                required
                            />
                             <TextField
                                label="Code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                placeholder="e.g. L-01"
                                fullWidth
                                required
                            />
                        </div>
                        <TextField
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Building A, 1st Floor"
                            fullWidth
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Capacity"
                                name="capacity"
                                type="number"
                                value={formData.capacity}
                                onChange={handleChange}
                                fullWidth
                                required
                            />
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="isActive"
                                    value={formData.isActive}
                                    onChange={handleChange}
                                    label="Status"
                                >
                                    <MenuItem value={true}>Active</MenuItem>
                                    <MenuItem value={false}>Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                        
                        <FormControl fullWidth>
                            <InputLabel id="facilities-label">Facilities</InputLabel>
                            <Select
                                labelId="facilities-label"
                                multiple
                                value={formData.facilities}
                                onChange={handleFacilitiesChange}
                                input={<OutlinedInput label="Facilities" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                                MenuProps={MenuProps}
                            >
                                {FACILITIES.map((facility) => (
                                    <MenuItem key={facility} value={facility}>
                                        <Checkbox checked={formData.facilities.indexOf(facility) > -1} />
                                        <ListItemText primary={facility} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions className="p-6 pt-2">
                    <Button onClick={handleClose} className="text-gray-600">Cancel</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        disabled={!formData.name || !formData.code || !formData.capacity}
                        className="bg-primary-500 hover:bg-primary-600"
                    >
                        {editingId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    )
}

export default Classrooms

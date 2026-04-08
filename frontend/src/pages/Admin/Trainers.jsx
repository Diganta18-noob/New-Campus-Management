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
    Avatar,
    Box,
    Chip,
    Card,
    CardContent,
    Grid,
} from '@mui/material'
import { 
    Add as AddIcon, 
    Close as CloseIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Class as BatchIcon,
    AssignmentInd as RoleIcon,
    History as HistoryIcon,
    TrendingUp as PerformanceIcon
} from '@mui/icons-material'
import DataTable from '../../components/ui/DataTable'
import { usersAPI, batchesAPI } from '../../services/api'

const Trainers = () => {
    const [trainers, setTrainers] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [selectedTrainer, setSelectedTrainer] = useState(null) // For viewing details
    
    // For creating new trainer
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        role: 'TRAINER'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [usersRes, batchesRes] = await Promise.all([
                usersAPI.getAll({ role: 'TRAINER' }),
                batchesAPI.getAll()
            ])
            
            const allBatches = batchesRes.data || []
            const allTrainers = usersRes.data || []

            // Process trainers to add batch info
            const processedTrainers = allTrainers.map(trainer => {
                const trainerBatches = allBatches.filter(batch => 
                    batch.trainers && batch.trainers.some(t => t._id === trainer._id || t === trainer._id)
                )

                const currentBatches = trainerBatches.filter(b => b.status === 'ONGOING' || b.status === 'PLANNING')
                const pastBatches = trainerBatches.filter(b => b.status === 'COMPLETED')
                
                return {
                    ...trainer,
                    id: trainer._id,
                    currentBatches,
                    pastBatches,
                    totalBatches: trainerBatches.length,
                    activeLoad: currentBatches.length
                }
            })

            setTrainers(processedTrainers)
        } catch (error) {
            console.error('Error fetching trainers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            await usersAPI.create(formData)
            setAddModalOpen(false)
            fetchData()
        } catch (error) {
            console.error('Error creating trainer:', error)
            alert(error.message || 'Error creating trainer')
        }
    }

    const columns = [
        {
            field: 'name',
            headerName: 'Trainer Name',
            flex: 1.5,
            renderCell: (row) => (
                <div className="flex items-center gap-3">
                    <Avatar 
                        sx={{ bgcolor: 'primary.main' }}
                        src={row.avatar}
                    >
                        {row.firstName?.[0]}{row.lastName?.[0]}
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{row.firstName} {row.lastName}</span>
                        <span className="text-xs text-gray-500">{row.username}</span>
                    </div>
                </div>
            )
        },
        { 
            field: 'email', 
            headerName: 'Contact', 
            flex: 1.5,
            renderCell: (row) => (
                <div className="flex flex-col text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                        <EmailIcon fontSize="small" className="text-gray-400" />
                        {row.email}
                    </div>
                    {row.phone && (
                        <div className="flex items-center gap-1 text-gray-500">
                            <PhoneIcon fontSize="small" className="text-gray-400" />
                            {row.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            field: 'currentBatches',
            headerName: 'Current Allocation',
            flex: 2,
            renderCell: (row) => (
                <div className="flex flex-col gap-1 py-1">
                    {row.currentBatches.length > 0 ? (
                        row.currentBatches.map(batch => (
                            <Chip 
                                key={batch._id} 
                                label={batch.name} 
                                size="small" 
                                color="primary" 
                                variant="outlined" 
                                className="justify-start"
                            />
                        ))
                    ) : (
                        <span className="text-gray-400 italic text-sm">Not allocated</span>
                    )}
                </div>
            )
        },
        {
            field: 'performance',
            headerName: 'Performance Stats',
            width: 150,
            renderCell: (row) => (
                <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-emerald-600">
                        Total Batches: {row.totalBatches}
                    </span>
                    <span className="text-gray-600">
                        History: {row.pastBatches.length} Completed
                    </span>
                </div>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 100,
            renderCell: (row) => (
                <Chip
                    label={row.isActive ? 'Active' : 'Inactive'}
                    color={row.isActive ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (row) => (
                <Button 
                    variant="text" 
                    size="small" 
                    onClick={() => {
                        setSelectedTrainer(row)
                        setOpenModal(true)
                    }}
                >
                    View Details
                </Button>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Trainers
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        Manage trainers, view allocations and performance
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddModalOpen(true)}
                    className="bg-primary-500"
                >
                    Add Trainer
                </Button>
            </div>

            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <DataTable
                    columns={columns}
                    data={trainers}
                    loading={loading}
                    rowHeight={80} // Taller rows for batch chips
                />
            </Paper>

            {/* Trainer Details Modal */}
            <Dialog 
                open={openModal} 
                onClose={() => setOpenModal(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedTrainer && (
                    <>
                        <DialogTitle className="border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar 
                                        sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
                                    >
                                        {selectedTrainer.firstName[0]}{selectedTrainer.lastName[0]}
                                    </Avatar>
                                    <div>
                                        <Typography variant="h6">
                                            {selectedTrainer.firstName} {selectedTrainer.lastName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {selectedTrainer.email}
                                        </Typography>
                                    </div>
                                </div>
                                <IconButton onClick={() => setOpenModal(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </div>
                        </DialogTitle>
                        <DialogContent className="pt-6">
                            <Grid container spacing={3}>
                                {/* Stats Cards */}
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined" className="bg-blue-50 border-blue-100">
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Active Batches
                                            </Typography>
                                            <Typography variant="h4" className="text-blue-600 font-bold">
                                                {selectedTrainer.activeLoad}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined" className="bg-emerald-50 border-emerald-100">
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Completed Batches
                                            </Typography>
                                            <Typography variant="h4" className="text-emerald-600 font-bold">
                                                {selectedTrainer.pastBatches.length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card variant="outlined" className="bg-purple-50 border-purple-100">
                                        <CardContent>
                                            <Typography color="textSecondary" gutterBottom>
                                                Total Experience
                                            </Typography>
                                            <Typography variant="h4" className="text-purple-600 font-bold">
                                                {selectedTrainer.totalBatches} <span className="text-sm font-normal text-gray-500">batches</span>
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Current Allocations */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" className="mb-3 flex items-center gap-2">
                                        <BatchIcon color="primary" /> Current Allocations
                                    </Typography>
                                    {selectedTrainer.currentBatches.length > 0 ? (
                                        <div className="grid gap-3">
                                            {selectedTrainer.currentBatches.map(batch => (
                                                <Paper key={batch._id} variant="outlined" className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <Typography variant="subtitle1" className="font-semibold">
                                                                {batch.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                {batch.code} • {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                                                            </Typography>
                                                        </div>
                                                        <Chip label={batch.status} color="primary" size="small" />
                                                    </div>
                                                </Paper>
                                            ))}
                                        </div>
                                    ) : (
                                        <Typography color="textSecondary" className="italic">
                                            No ongoing allocations.
                                        </Typography>
                                    )}
                                </Grid>

                                {/* Batch History */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" className="mb-3 flex items-center gap-2">
                                        <HistoryIcon color="action" /> Batch History
                                    </Typography>
                                    {selectedTrainer.pastBatches.length > 0 ? (
                                        <div className="grid gap-3">
                                            {selectedTrainer.pastBatches.map(batch => (
                                                <Paper key={batch._id} variant="outlined" className="p-3 bg-gray-50">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <Typography variant="subtitle1" className="font-medium text-gray-700">
                                                                {batch.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                Ended: {new Date(batch.endDate).toLocaleDateString()}
                                                            </Typography>
                                                        </div>
                                                        <Chip label="Completed" size="small" className="bg-gray-200" />
                                                    </div>
                                                </Paper>
                                            ))}
                                        </div>
                                    ) : (
                                        <Typography color="textSecondary" className="italic">
                                            No past batches found.
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            {/* Add Trainer Modal */}
            <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
                 <DialogTitle>Add New Trainer</DialogTitle>
                 <DialogContent className="pt-4">
                     <div className="grid gap-4 mt-2">
                            <TextField 
                                label="First Name" 
                                fullWidth 
                                value={formData.firstName}
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            />
                            <TextField 
                                label="Last Name" 
                                fullWidth 
                                value={formData.lastName}
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            />
                            <TextField 
                                label="Email" 
                                fullWidth 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                            <TextField 
                                label="Username" 
                                fullWidth 
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                            <TextField 
                                label="Phone" 
                                fullWidth 
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                     </div>
                 </DialogContent>
                 <DialogActions>
                     <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
                     <Button variant="contained" onClick={handleCreate}>Create</Button>
                 </DialogActions>
            </Dialog>
        </div>
    )
}

export default Trainers

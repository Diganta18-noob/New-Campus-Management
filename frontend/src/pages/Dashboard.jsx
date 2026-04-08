import { Typography, Paper, Chip } from '@mui/material'
import {
    School as SchoolIcon,
    MenuBook as MenuBookIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
} from '@mui/icons-material'
import StatsCard from '../components/ui/StatsCard'
import { useData } from '../context/DataContext'

const Dashboard = () => {
    const { getStats } = useData()
    const stats = getStats()

    const statsCards = [
        { title: 'Total Departments', value: stats.totalDepartments, icon: SchoolIcon, color: 'primary' },
        { title: 'Total Batches', value: stats.totalBatches, icon: MenuBookIcon, color: 'success' },
        { title: 'Total Trainers', value: stats.totalTeachers, icon: PersonIcon, color: 'warning' },
        { title: 'Total Learners', value: stats.totalStudents, icon: PeopleIcon, color: 'info' },
    ]

    const recentActivity = [
        { action: 'New department created', time: '2 hours ago', type: 'success' },
        { action: 'Subject added to MERN', time: '3 hours ago', type: 'success' },
        { action: 'Student bulk import completed', time: '5 hours ago', type: 'success' },
        { action: 'Server Maintenance', time: '1 day ago', type: 'warning' },
        { action: 'Server Online', time: '2 days ago', type: 'success' },
    ]

    const systemStatus = [
        { name: 'Database Server', status: 'Online' },
        { name: 'API Server', status: 'Online' },
        { name: 'Email Service', status: 'Online' },
        { name: 'Backup System', status: 'Online' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Admin Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    Overview of your classroom management system
                </Typography>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Activity and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Paper
                    elevation={0}
                    sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                        Recent Activity
                    </Typography>
                    <ul className="space-y-3">
                        {recentActivity.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between p-3 rounded-xl"
                                style={{ backgroundColor: 'var(--activity-bg, rgba(0,0,0,0.03))' }}
                            >
                                <div className="flex items-center gap-3">
                                    {item.type === 'success' ? (
                                        <CheckIcon className="text-emerald-500" />
                                    ) : (
                                        <ErrorIcon className="text-amber-500" />
                                    )}
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{item.action}</Typography>
                                </div>
                                <Typography variant="caption" sx={{ color: 'text.disabled' }}>{item.time}</Typography>
                            </li>
                        ))}
                    </ul>
                </Paper>

                {/* System Status */}
                <Paper
                    elevation={0}
                    sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}
                >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                        System Status
                    </Typography>
                    <ul className="space-y-3">
                        {systemStatus.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between p-3 rounded-xl"
                                style={{ backgroundColor: 'var(--activity-bg, rgba(0,0,0,0.03))' }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{item.name}</Typography>
                                <Chip
                                    label={item.status}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        fontWeight: 500,
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                </Paper>
            </div>
        </div>
    )
}

export default Dashboard

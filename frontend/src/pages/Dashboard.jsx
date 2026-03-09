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
                <Typography variant="h4" className="font-bold text-gray-800">
                    Admin Dashboard
                </Typography>
                <Typography variant="body2" className="text-gray-500 mt-1">
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
                    className="p-6 rounded-2xl border border-gray-100"
                >
                    <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
                        Recent Activity
                    </Typography>
                    <ul className="space-y-3">
                        {recentActivity.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    {item.type === 'success' ? (
                                        <CheckIcon className="text-emerald-500" />
                                    ) : (
                                        <ErrorIcon className="text-amber-500" />
                                    )}
                                    <span className="text-gray-700 font-medium">{item.action}</span>
                                </div>
                                <span className="text-gray-400 text-sm">{item.time}</span>
                            </li>
                        ))}
                    </ul>
                </Paper>

                {/* System Status */}
                <Paper
                    elevation={0}
                    className="p-6 rounded-2xl border border-gray-100"
                >
                    <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
                        System Status
                    </Typography>
                    <ul className="space-y-3">
                        {systemStatus.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                            >
                                <span className="text-gray-700 font-medium">{item.name}</span>
                                <Chip
                                    label={item.status}
                                    size="small"
                                    className="bg-emerald-100 text-emerald-700 font-medium"
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

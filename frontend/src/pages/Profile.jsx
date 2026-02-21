import { Typography, Paper, Avatar, Grid, Divider } from '@mui/material'
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/slices/authSlice'

const Profile = () => {
    const user = useAppSelector(selectUser)

    if (!user) {
        return <Typography>Loading profile...</Typography>
    }

    return (
        <div className="space-y-6">
            <div>
                <Typography variant="h4" className="font-bold text-gray-800">
                    My Profile
                </Typography>
                <Typography variant="body2" className="text-gray-500 mt-1">
                    Manage your account settings and preferences
                </Typography>
            </div>

            <Grid container spacing={4}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100 flex flex-col items-center text-center h-full">
                        <Avatar
                            alt={user.firstName}
                            src={user.avatar}
                            sx={{ width: 120, height: 120, fontSize: '3rem' }}
                            className="bg-primary-100 text-primary-600 font-bold mb-4"
                        >
                            {user.firstName?.charAt(0)}
                        </Avatar>

                        <Typography variant="h5" className="font-bold text-gray-800">
                            {user.firstName} {user.lastName}
                        </Typography>

                        <Typography variant="body1" className="text-gray-500 mb-6">
                            {user.role.replace('_', ' ')}
                        </Typography>

                        <div className="w-full space-y-3 mt-auto">
                            {/* Add Status or other quick stats here if needed */}
                            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                                Active Account
                            </div>
                        </div>
                    </Paper>
                </Grid>

                {/* Details Card */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} className="p-6 rounded-2xl border border-gray-100 h-full">
                        <Typography variant="h6" className="font-bold text-gray-800 mb-6">
                            Personal Information
                        </Typography>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <PersonIcon fontSize="small" />
                                        <span className="text-sm">Username</span>
                                    </div>
                                    <Typography variant="body1" className="font-medium text-gray-800">
                                        {user.username}
                                    </Typography>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <BadgeIcon fontSize="small" />
                                        <span className="text-sm">Role</span>
                                    </div>
                                    <Typography variant="body1" className="font-medium text-gray-800">
                                        {user.role.replace('_', ' ')}
                                    </Typography>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <EmailIcon fontSize="small" />
                                        <span className="text-sm">Email</span>
                                    </div>
                                    <Typography variant="body1" className="font-medium text-gray-800">
                                        {user.email}
                                    </Typography>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <PhoneIcon fontSize="small" />
                                        <span className="text-sm">Phone</span>
                                    </div>
                                    <Typography variant="body1" className="font-medium text-gray-800">
                                        {user.phone || 'Not provided'}
                                    </Typography>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                                        <CalendarIcon fontSize="small" />
                                        <span className="text-sm">Joined</span>
                                    </div>
                                    <Typography variant="body1" className="font-medium text-gray-800">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </Typography>
                                </div>
                            </div>
                        </div>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    )
}

export default Profile

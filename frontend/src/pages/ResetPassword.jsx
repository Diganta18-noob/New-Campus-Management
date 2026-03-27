import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    TextField,
    Button,
    Paper,
    Typography,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    Box,
} from '@mui/material'
import {
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    LockReset as LockResetIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
    changePassword,
    selectAuthLoading,
    selectAuthError,
    selectUser,
    clearPasswordResetFlag,
} from '../store/slices/authSlice'

const ResetPassword = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const loading = useAppSelector(selectAuthLoading)
    const authError = useAppSelector(selectAuthError)
    const user = useAppSelector(selectUser)

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [success, setSuccess] = useState(false)
    const [localError, setLocalError] = useState('')
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setLocalError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLocalError('')

        // Validate
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setLocalError('Please fill in all fields')
            return
        }

        if (formData.newPassword.length < 6) {
            setLocalError('New password must be at least 6 characters')
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setLocalError('New passwords do not match')
            return
        }

        if (formData.currentPassword === formData.newPassword) {
            setLocalError('New password must be different from current password')
            return
        }

        try {
            await dispatch(changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            })).unwrap()

            setSuccess(true)
            dispatch(clearPasswordResetFlag())

            // Redirect to dashboard after a brief delay
            setTimeout(() => {
                navigate('/dashboard')
            }, 2000)
        } catch (error) {
            setLocalError(error || 'Failed to change password')
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Sidebar - same aesthetic as Login */}
            <div className="w-96 bg-gradient-to-br from-primary-600 to-primary-800 p-8 flex flex-col text-white">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <span className="text-2xl font-bold">A</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">AttendEase</h1>
                            <p className="text-primary-200 text-sm">College Classroom Management System</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <LockResetIcon className="text-5xl text-primary-200 mb-4" />
                        <h2 className="text-xl font-semibold mb-3">Password Reset Required</h2>
                        <p className="text-primary-200 text-sm leading-relaxed">
                            For security purposes, you need to change your default password before accessing the system.
                        </p>
                        <div className="mt-4 p-3 bg-white/10 rounded-xl">
                            <p className="text-primary-100 text-xs">
                                <strong>Your current password:</strong> The default password provided by your administrator (Default@123)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <p className="text-primary-200 text-sm">© 2026 AttendEase. All rights reserved.</p>
                </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <Paper
                    elevation={0}
                    className="w-full max-w-md p-10 rounded-3xl border border-gray-100"
                >
                    {success ? (
                        <Box className="text-center py-8">
                            <Box
                                className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                                sx={{ backgroundColor: '#D1FAE5' }}
                            >
                                <LockResetIcon sx={{ color: '#10B981', fontSize: 32 }} />
                            </Box>
                            <Typography variant="h5" className="font-bold text-gray-800 mb-2">
                                Password Changed!
                            </Typography>
                            <Typography variant="body2" className="text-gray-500">
                                Redirecting you to the dashboard...
                            </Typography>
                            <CircularProgress size={24} className="mt-4" />
                        </Box>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <Box
                                    className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
                                    sx={{ backgroundColor: '#FEF3C7' }}
                                >
                                    <LockResetIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
                                </Box>
                                <Typography variant="h5" className="font-bold text-gray-800 mb-2">
                                    Set Your New Password
                                </Typography>
                                <Typography variant="body2" className="text-gray-500">
                                    Welcome{user?.firstName ? `, ${user.firstName}` : ''}! Please create a new password to secure your account.
                                </Typography>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {(localError || authError) && (
                                    <Alert severity="error" className="mb-4">
                                        {localError || authError}
                                    </Alert>
                                )}

                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    label="Current Password"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    placeholder="Enter your default password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    edge="end"
                                                >
                                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    name="newPassword"
                                    label="New Password"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="Enter new password (min 6 characters)"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    edge="end"
                                                >
                                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirm New Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your new password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    className="bg-primary-500 hover:bg-primary-600 py-3 text-lg font-semibold shadow-lg shadow-primary-500/30"
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                                </Button>
                            </form>
                        </>
                    )}
                </Paper>
            </div>
        </div>
    )
}

export default ResetPassword

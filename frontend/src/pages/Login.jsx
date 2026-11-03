import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
    Person as PersonIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { login, selectAuthLoading, selectAuthError, selectIsAuthenticated, selectRequiresPasswordReset, clearError } from '../store/slices/authSlice'
import './Login.css'

const Login = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const loading = useAppSelector(selectAuthLoading)
    const authError = useAppSelector(selectAuthError)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const requiresPasswordReset = useAppSelector(selectRequiresPasswordReset)

    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(requiresPasswordReset ? '/reset-password' : '/dashboard', { replace: true })
        }
    }, [isAuthenticated, requiresPasswordReset, navigate])

    // Clear error on mount
    useEffect(() => {
        dispatch(clearError())
    }, [dispatch])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoginError('')

        try {
            await dispatch(login({
                email: formData.email.trim(),
                password: formData.password,
            })).unwrap()

        } catch (error) {
            setLoginError(error || 'Login failed. Please check your credentials.')
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const trainingPrograms = [
        'MERN Stack Development',
        'MEAN Stack Development',
        'Java Full Stack',
        'SDET Java',
        'SDET Python',
    ]

    return (
        <div className="login-shell">
            {/* Left Sidebar */}
            <div className="login-story">
                <div className="login-orbit login-orbit-one" aria-hidden="true" />
                <div className="login-orbit login-orbit-two" aria-hidden="true" />
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <span className="text-2xl font-bold">A</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">AttendEase</h1>
                            <p className="text-primary-200 text-sm">Your education operations hub</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 login-story-content">
                    <p className="login-eyebrow">A clearer view of campus</p>
                    <h2 className="login-headline">Great learning.<br />Thoughtfully managed.</h2>
                    <p className="login-description">Bring your people, programs and daily operations together in one focused workspace.</p>
                    <h3 className="text-lg font-semibold mb-4 text-primary-100">Built for your programs</h3>
                    <ul className="space-y-3">
                        {trainingPrograms.map((program, index) => (
                            <li
                                key={index}
                                className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-colors"
                            >
                                <div className="w-2 h-2 bg-primary-300 rounded-full"></div>
                                <span className="text-sm font-medium">{program}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-auto">
                    <p className="text-primary-200 text-sm">© 2026 AttendEase. All rights reserved.</p>
                </div>
            </div>

            {/* Right Content */}
            <Box component="main" className="login-main" sx={{ bgcolor: 'background.default' }}>
                <Paper
                    elevation={0}
                    className="login-card w-full max-w-md border border-gray-100"
                    sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4 }}
                >
                    <div className="text-center mb-8">
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to your account to continue
                        </Typography>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {(loginError || authError) && (
                            <Alert severity="error" className="mb-4">
                                {loginError || authError}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            disabled={loading}
                            label="Email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            name="password"
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={formData.password}
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
                                            type="button"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Typography variant="body2" color="text.secondary">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary-500 hover:underline font-medium">
                                Sign Up
                            </Link>
                        </Typography>
                    </div>
                </Paper>
            </Box>
        </div>
    )
}

export default Login

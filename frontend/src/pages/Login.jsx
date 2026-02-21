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
} from '@mui/material'
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { login, selectAuthLoading, selectAuthError, selectIsAuthenticated, clearError } from '../store/slices/authSlice'

const Login = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const loading = useAppSelector(selectAuthLoading)
    const authError = useAppSelector(selectAuthError)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)

    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard')
        }
    }, [isAuthenticated, navigate])

    // Clear error on mount
    useEffect(() => {
        dispatch(clearError())
    }, [dispatch])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoginError('')

        try {
            await dispatch(login({
                email: formData.email, // Backend expects email
                password: formData.password,
            })).unwrap()

            navigate('/dashboard')
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
        <div className="min-h-screen flex">
            {/* Left Sidebar */}
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

                <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-4 text-primary-100">What we teach</h2>
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
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <Paper
                    elevation={0}
                    className="w-full max-w-md p-10 rounded-3xl border border-gray-100"
                >
                    <div className="text-center mb-8">
                        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
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
                        <Typography variant="body2" className="text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary-500 hover:underline font-medium">
                                Sign Up
                            </Link>
                        </Typography>
                    </div>
                </Paper>
            </div>
        </div>
    )
}

export default Login

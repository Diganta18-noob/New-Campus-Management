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
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material'
import {
    UserRound as PersonIcon,
    LockKeyhole as LockIcon,
    Mail as EmailIcon,
    Phone as PhoneIcon,
    IdCard as BadgeIcon,
    Eye as Visibility,
    EyeOff as VisibilityOff,
    BookOpen,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { register, selectAuthLoading, selectIsAuthenticated, clearError } from '../store/slices/authSlice'
import './Login.css'

// Available roles for signup
const ROLES = [
    { value: 'LEARNER', label: 'Learner', description: 'Student/Trainee' },
]

const Signup = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const loading = useAppSelector(selectAuthLoading)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)

    const [showPassword, setShowPassword] = useState(false)
    const [signupError, setSignupError] = useState('')
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        role: 'LEARNER',
        password: '',
        confirmPassword: '',
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
        setSignupError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setSignupError('Passwords do not match')
            return
        }

        if (formData.password.length < 6) {
            setSignupError('Password must be at least 6 characters')
            return
        }

        try {
            await dispatch(register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                password: formData.password,
            })).unwrap()

            navigate('/dashboard')
        } catch (error) {
            setSignupError(error || 'Registration failed. Please try again.')
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
            <div className="login-story signup-story">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                            <BookOpen className="login-brand-icon" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">AttendEase</h1>
                            <p className="text-primary-200 text-sm">Your education operations hub</p>
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
            <Box component="main" className="login-main" sx={{ bgcolor: 'background.default' }}>
                <Paper
                    elevation={0}
                    className="w-full max-w-md border border-gray-100"
                    sx={{ p: { xs: 3, sm: 5 }, borderRadius: '20px' }}
                >
                    <div className="text-center mb-6">
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                            Create Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign up to get started with AttendEase
                        </Typography>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {signupError && (
                            <Alert severity="error" className="mb-4">
                                {signupError}
                            </Alert>
                        )}

                        <div className="flex gap-3">
                            <TextField
                                fullWidth
                                name="firstName"
                                label="First Name"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                size="small"
                            />
                            <TextField
                                fullWidth
                                name="lastName"
                                label="Last Name"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                size="small"
                            />
                        </div>

                        <TextField
                            fullWidth
                            name="username"
                            label="Username"
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={handleChange}
                            required
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
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            name="phone"
                            label="Phone (Optional)"
                            placeholder="+1 234 567 8900"
                            value={formData.phone}
                            onChange={handleChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            select
                            name="role"
                            label="Role"
                            helperText="Staff accounts are created by your campus administrator."
                            value={formData.role}
                            onChange={handleChange}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BadgeIcon className="text-gray-400" />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {ROLES.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                    <div>
                                        <span className="font-medium">{role.label}</span>
                                        <span className="text-gray-400 text-sm ml-2">- {role.description}</span>
                                    </div>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 6 characters"
                            value={formData.password}
                            onChange={handleChange}
                            required
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

                        <TextField
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon className="text-gray-400" />
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
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <Typography variant="body2" className="text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-500 hover:underline font-medium">
                                Sign In
                            </Link>
                        </Typography>
                    </div>
                </Paper>
            </Box>
        </div>
    )
}

export default Signup

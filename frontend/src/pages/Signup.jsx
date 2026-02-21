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
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material'
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { register, selectAuthLoading, selectIsAuthenticated, clearError } from '../store/slices/authSlice'

// Available roles for signup
const ROLES = [
    { value: 'ADMIN', label: 'Admin', description: 'Full system access' },
    { value: 'MANAGER', label: 'Manager', description: 'Manage batches and users' },
    { value: 'TEAM_LEADER', label: 'Team Leader', description: 'Lead training teams' },
    { value: 'TRAINER', label: 'Trainer', description: 'Conduct training sessions' },
    { value: 'TA', label: 'Teaching Assistant', description: 'Assist trainers' },
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
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8 overflow-y-auto">
                <Paper
                    elevation={0}
                    className="w-full max-w-md p-10 rounded-3xl border border-gray-100"
                >
                    <div className="text-center mb-6">
                        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
                            Create Account
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
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
            </div>
        </div>
    )
}

export default Signup

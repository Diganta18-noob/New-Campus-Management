import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TextField, Button, Paper, InputAdornment, IconButton, Alert, CircularProgress, Tooltip } from '@mui/material'
import { Mail, LockKeyhole, Eye, EyeOff, BookOpen, ArrowRight, ArrowUpRight, Sun, Moon, Monitor, GraduationCap, Layers3, UsersRound } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { login, selectAuthLoading, selectAuthError, selectIsAuthenticated, selectRequiresPasswordReset, clearError } from '../store/slices/authSlice'
import { useThemeMode } from '../context/ThemeContext'
import CampusScene from '../components/auth/CampusScene'
import './Login.css'
import './LoginLanding.css'

export default function Login() {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const loading = useAppSelector(selectAuthLoading)
    const authError = useAppSelector(selectAuthError)
    const isAuthenticated = useAppSelector(selectIsAuthenticated)
    const requiresPasswordReset = useAppSelector(selectRequiresPasswordReset)
    const { themeMode, cycleThemeMode } = useThemeMode()
    const ThemeIcon = { light: Sun, dark: Moon, system: Monitor }[themeMode] || Monitor
    const [showPassword, setShowPassword] = useState(false)
    const [loginError, setLoginError] = useState('')
    const [formData, setFormData] = useState({ email: '', password: '' })

    useEffect(() => {
        if (isAuthenticated) navigate(requiresPasswordReset ? '/reset-password' : '/dashboard', { replace: true })
    }, [isAuthenticated, requiresPasswordReset, navigate])
    useEffect(() => { dispatch(clearError()) }, [dispatch])

    const handleSubmit = async event => {
        event.preventDefault()
        if (loading) return
        setLoginError('')
        try {
            await dispatch(login({ email: formData.email.trim(), password: formData.password })).unwrap()
        } catch (error) {
            setLoginError(typeof error === 'string' ? error : error?.message || 'Unable to sign in. Please check your credentials.')
        }
    }
    const handleChange = event => setFormData(current => ({ ...current, [event.target.name]: event.target.value }))

    return <div className="login-shell login-landing">
        <div className="entry-glow entry-glow-one login-orbit" aria-hidden="true" /><div className="entry-glow entry-glow-two login-orbit" aria-hidden="true" />
        <header className="entry-header">
            <Link to="/login" className="entry-brand" aria-label="AttendEase home"><span className="entry-brand-mark"><BookOpen size={22} strokeWidth={1.5} /></span><span><strong>AttendEase<span>.</span></strong><small>THE CAMPUS WORKSPACE</small></span></Link>
            <nav className="entry-nav" aria-label="Welcome navigation"><a href="#platform-highlights" className="entry-platform-link">The platform</a><Tooltip title={`Appearance: ${themeMode}`}><IconButton aria-label={`Appearance: ${themeMode}. Change appearance`} onClick={cycleThemeMode}><ThemeIcon size={17} strokeWidth={1.6} /></IconButton></Tooltip><Link to="/signup" className="entry-signup-link">Create account <ArrowUpRight size={14} /></Link></nav>
        </header>
        <main className="entry-main">
            <section className="entry-hero" aria-labelledby="entry-heading">
                <div className="entry-eyebrow"><span />A LITTLE MORE CLARITY. EVERY DAY.</div>
                <h1 id="entry-heading">A brighter campus.<br />A clearer <span>everyday.</span></h1>
                <p className="entry-description">Bring your people, programs and daily progress into one thoughtfully connected workspace.</p>
                <CampusScene />
                <div className="entry-highlights" id="platform-highlights" aria-label="Platform highlights"><span><UsersRound size={15} />People, connected</span><span><Layers3 size={15} />Programs, organised</span><span><GraduationCap size={16} />Learning, in focus</span></div>
            </section>
            <div className="entry-form-column">
                <Paper component="section" className="login-card entry-card" aria-labelledby="sign-in-heading">
                    <div className="entry-card-topline"><span className="entry-card-symbol"><BookOpen size={19} strokeWidth={1.5} /></span><span>YOUR NEXT CHAPTER STARTS HERE</span></div>
                    <h2 id="sign-in-heading">Welcome back<span>.</span></h2>
                    <p className="entry-card-description">A new day. A little more possibility.<br />Sign in to your campus workspace.</p>
                    <form onSubmit={handleSubmit} className="entry-form" aria-label="Sign in to AttendEase" aria-busy={loading}>
                        {(loginError || authError) && <Alert severity="error">{loginError || authError}</Alert>}
                        <div className="entry-field"><label htmlFor="login-email">Email address</label><TextField id="login-email" fullWidth name="email" type="email" autoComplete="username" required disabled={loading} placeholder="you@campus.edu" value={formData.email} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Mail size={17} strokeWidth={1.6} /></InputAdornment> }} /></div>
                        <div className="entry-field"><label htmlFor="login-password">Password</label><TextField id="login-password" fullWidth name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required disabled={loading} placeholder="Enter your password" value={formData.password} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><LockKeyhole size={17} strokeWidth={1.6} /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} edge="end">{showPassword ? <EyeOff size={17} strokeWidth={1.6} /> : <Eye size={17} strokeWidth={1.6} />}</IconButton></InputAdornment> }} /></div>
                        <Button type="submit" fullWidth variant="contained" disabled={loading} className="entry-submit" endIcon={!loading && <ArrowRight size={17} strokeWidth={1.7} />}>{loading ? <><CircularProgress size={17} color="inherit" /><span>Signing you in…</span></> : 'Sign in to workspace'}</Button>
                    </form>
                    <div className="entry-card-divider"><span /><small>NEW TO ATTENDEASE?</small><span /></div>
                    <Link to="/signup" className="entry-create-link">Create your learner account <ArrowUpRight size={15} /></Link>
                    <p className="entry-account-note">Staff access is provided by your campus administrator.</p>
                </Paper>
                <div className="entry-form-note"><LockKeyhole size={13} strokeWidth={1.7} /><span>Your own space to make a difference.</span></div>
            </div>
        </main>
        <footer className="entry-footer"><span>© {new Date().getFullYear()} AttendEase</span><span>Thoughtfully built for the everyday work of education.</span><span className="entry-footer-detail"><span />People. Programs. Possibilities.</span></footer>
    </div>
}

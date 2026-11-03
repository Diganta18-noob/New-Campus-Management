import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Box, useMediaQuery } from '@mui/material'
import { ChevronRight, CalendarDays, UserRound } from 'lucide-react'
import Sidebar from './Sidebar'

const titles = { dashboard: 'Overview', departments: 'Departments', batches: 'Batches', classrooms: 'Classrooms', topics: 'Courses & topics', students: 'People directory', trainers: 'Trainers', tas: 'Teaching assistants', attendance: 'Attendance', 'audit-logs': 'Audit trail', profile: 'My profile', 'daily-updates': 'Daily updates', 'my-attendance': 'My attendance', performance: 'Performance' }
export default function MainLayout() {
    const compact = useMediaQuery('(max-width:800px)')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileExpanded, setMobileExpanded] = useState(false)
    const collapsed = compact ? !mobileExpanded : sidebarCollapsed
    const { pathname } = useLocation()
    const title = titles[pathname.split('/')[1]] || 'Workspace'
    const toggleSidebar = () => compact ? setMobileExpanded(value => !value) : setSidebarCollapsed(value => !value)
    return <Box className="campus-app" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} onNavigate={() => setMobileExpanded(false)} />
        {compact && mobileExpanded && <Box component="button" aria-label="Close navigation" onClick={() => setMobileExpanded(false)} sx={{ position: 'fixed', inset: 0, left: 256, border: 0, bgcolor: 'rgba(0,0,0,.35)', zIndex: 40 }} />}
        <Box className="workspace-shell" sx={{ ml: compact || collapsed ? '80px' : '256px', minWidth: 0 }}>
            <header className="workspace-bar">
                <nav className="workspace-breadcrumbs" aria-label="Breadcrumb"><Link to="/dashboard">Workspace</Link><ChevronRight size={13} /><span aria-current="page">{title}</span></nav>
                <div className="workspace-bar-actions"><span className="workspace-date"><CalendarDays size={14} strokeWidth={1.7} />{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="workspace-divider" /><Link to="/profile" aria-label="My profile" className="top-profile-link"><UserRound size={16} strokeWidth={1.7} /></Link></div>
            </header>
            <main id="main-content" tabIndex={-1} className="workspace-content"><Outlet /></main>
        </Box>
    </Box>
}

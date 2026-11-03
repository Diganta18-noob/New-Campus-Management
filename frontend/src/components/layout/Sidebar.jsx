import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Avatar, Box, ButtonBase, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { BookOpen, LayoutDashboard, Landmark, DoorOpen, Layers3, UsersRound, GraduationCap, ContactRound, CalendarCheck2, NotebookPen, ChartNoAxesCombined, History, Sun, Moon, Monitor, PanelLeftClose, PanelLeftOpen, ChevronsUpDown, LogOut, UserRound } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { selectUser, logout } from '../../store/slices/authSlice'
import { useThemeMode } from '../../context/ThemeContext'

const links = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, group: 'Workspace' },
    { path: '/departments', label: 'Departments', icon: Landmark, group: 'Academics', roles: ['ADMIN', 'MANAGER'] },
    { path: '/batches', label: 'Batches', icon: Layers3, group: 'Academics', roles: ['ADMIN', 'MANAGER'] },
    { path: '/topics', label: 'Courses & topics', icon: BookOpen, group: 'Academics', roles: ['ADMIN', 'MANAGER'] },
    { path: '/classrooms', label: 'Classrooms', icon: DoorOpen, group: 'Academics', roles: ['ADMIN', 'MANAGER'] },
    { path: '/students', label: 'People directory', icon: UsersRound, group: 'People', roles: ['ADMIN'] },
    { path: '/trainers', label: 'Trainers', icon: GraduationCap, group: 'People', roles: ['ADMIN', 'MANAGER'] },
    { path: '/tas', label: 'Teaching assistants', icon: ContactRound, group: 'People', roles: ['ADMIN', 'MANAGER'] },
    { path: '/attendance', label: 'Mark attendance', icon: CalendarCheck2, group: 'Workspace', roles: ['TRAINER', 'TA'] },
    { path: '/daily-updates', label: 'Daily updates', icon: NotebookPen, group: 'Workspace', roles: ['TRAINER', 'TA'] },
    { path: '/attendance/history', label: 'Attendance reports', icon: ChartNoAxesCombined, group: 'Insights', roles: ['ADMIN', 'MANAGER', 'TEAM_LEADER'] },
    { path: '/daily-updates/review', label: 'Review updates', icon: NotebookPen, group: 'Insights', roles: ['MANAGER', 'TEAM_LEADER'] },
    { path: '/my-attendance', label: 'My attendance', icon: CalendarCheck2, group: 'Workspace', roles: ['LEARNER'] },
    { path: '/performance', label: 'My performance', icon: ChartNoAxesCombined, group: 'Insights', roles: ['LEARNER'] },
    { path: '/audit-logs', label: 'Audit trail', icon: History, group: 'Insights', roles: ['ADMIN'] },
]
const groups = ['Workspace', 'Academics', 'People', 'Insights']

export default function Sidebar({ collapsed, onToggle, onNavigate }) {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const user = useAppSelector(selectUser)
    const { themeMode, cycleThemeMode } = useThemeMode()
    const [anchor, setAnchor] = useState(null)
    const ThemeIcon = { light: Sun, dark: Moon, system: Monitor }[themeMode] || Monitor
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your account'
    const role = { ADMIN: 'Administrator', TA: 'Teaching assistant', TEAM_LEADER: 'Team leader' }[user?.role] || user?.role?.toLowerCase() || 'Member'
    const visible = links.filter(item => !item.roles || item.roles.includes(user?.role))
    return <Box component="aside" className={`campus-sidebar ${collapsed ? 'is-collapsed' : ''}`} sx={{ width: collapsed ? 80 : 256 }}>
        <div className="sidebar-brand">
            {!collapsed && <NavLink to="/dashboard" className="brand-link" aria-label="AttendEase home" onClick={onNavigate}>
                <span className="brand-mark"><BookOpen size={21} strokeWidth={1.7} /></span>
                <span><strong>AttendEase<span className="brand-period">.</span></strong><small>EDUCATION WORKSPACE</small></span>
            </NavLink>}
            <Tooltip title={collapsed ? 'Expand navigation' : 'Collapse navigation'} placement="right">
                <IconButton aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggle} size="small" className="sidebar-toggle">
                    {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.7} /> : <PanelLeftClose size={17} strokeWidth={1.7} />}
                </IconButton>
            </Tooltip>
        </div>
        <nav className="sidebar-navigation" aria-label="Main navigation">
            {groups.map(group => {
                const items = visible.filter(item => item.group === group)
                if (!items.length) return null
                return <section className="nav-group" key={group} aria-label={group}>
                    {!collapsed && <p className="nav-group-label">{group}</p>}
                    {items.map(({ path, label, icon: Icon }) => <Tooltip key={path} title={collapsed ? label : ''} placement="right"><span className="sidebar-link-wrap">
                        <NavLink to={path} end aria-label={label} onClick={onNavigate} className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}>
                            <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && path === '/dashboard' && <span className="nav-active-dot" aria-hidden="true" />}
                        </NavLink>
                    </span></Tooltip>)}
                </section>
            })}
        </nav>
        {!collapsed && <div className="workspace-note"><span className="workspace-note-mark"><GraduationCap size={18} strokeWidth={1.7} /></span><div><strong>A little more clarity.</strong><p>For every day on campus.</p></div></div>}
        <div className="sidebar-footer">
            <Tooltip title={`Appearance: ${themeMode}. Change appearance`} placement="right">
                <ButtonBase className="appearance-button" onClick={cycleThemeMode} aria-label={`Appearance: ${themeMode}. Change appearance`}>
                    <ThemeIcon size={17} strokeWidth={1.7} />
                    {!collapsed && <><span>Appearance</span><small>{themeMode}</small></>}
                </ButtonBase>
            </Tooltip>
            <ButtonBase className="sidebar-account" onClick={event => setAnchor(event.currentTarget)} aria-label={`Open account menu for ${name}`} aria-haspopup="menu" aria-expanded={!!anchor}>
                <Avatar src={user?.avatar} alt={name} sx={{ width: 32, height: 32, bgcolor: 'var(--campus-accent-soft)', color: 'var(--campus-accent)', fontSize: 12, fontWeight: 650, border: '1px solid var(--campus-border)' }}>{user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}</Avatar>
                {!collapsed && <><div className="account-copy"><strong>{name}</strong><small>{role}</small></div><ChevronsUpDown size={14} strokeWidth={1.7} /></>}
            </ButtonBase>
        </div>
        <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} onClick={() => setAnchor(null)} transformOrigin={{ horizontal: 'left', vertical: 'bottom' }} anchorOrigin={{ horizontal: 'left', vertical: 'top' }} PaperProps={{ sx: { minWidth: 190, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 36px #00000015', mb: 1 } }}>
            <MenuItem onClick={() => navigate('/profile')}><ListItemIcon><UserRound size={17} /></ListItemIcon>My profile</MenuItem>
            <Divider />
            <MenuItem onClick={async () => { await dispatch(logout()); navigate('/login') }}><ListItemIcon><LogOut size={17} /></ListItemIcon>Sign out</MenuItem>
        </Menu>
    </Box>
}

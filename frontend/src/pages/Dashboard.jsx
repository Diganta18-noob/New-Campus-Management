import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, CircularProgress, Paper } from '@mui/material'
import { UsersRound, UserRoundCheck, Layers3, CalendarCheck2, RefreshCw, ArrowUpRight, ArrowRight, BookOpen, GraduationCap, DoorOpen, History, ClipboardCheck, NotebookPen, CircleHelp } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { dashboardAPI } from '../services/api'
import StatsCard from '../components/ui/StatsCard'

const COLORS = ['#729c7b', '#b4c88c', '#d7bc82', '#8caeac', '#a49bb9', '#ce9f8d']
const names = { ADMIN: 'Administrators', MANAGER: 'Managers', TEAM_LEADER: 'Team leaders', TRAINER: 'Trainers', TA: 'Teaching assistants', LEARNER: 'Learners', PLANNING: 'Planning', ONGOING: 'Ongoing', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }
const label = value => names[value] || String(value || 'Unspecified').toLowerCase().replaceAll('_', ' ')

function Distribution({ title, description, rows, unit, icon: Icon }) {
    const data = (rows || []).filter(row => row.count > 0).map(row => ({ name: label(row._id), value: row.count }))
    const total = data.reduce((sum, row) => sum + row.value, 0)
    return <Paper component="section" className="dashboard-panel distribution-panel">
        <div className="panel-heading"><div><h2>{title}</h2><p>{description}</p></div><span className="panel-heading-icon"><Icon size={17} strokeWidth={1.7} /></span></div>
        {total === 0 ? <div className="chart-empty"><CircleHelp size={23} strokeWidth={1.5} /><p>No records to display yet.</p></div> : <div className="distribution-body">
            <div className="distribution-chart" role="img" aria-label={`${title}: ${data.map(row => `${row.name} ${row.value}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={66} outerRadius={81} paddingAngle={data.length > 1 ? 4 : 0} cornerRadius={3} stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>
                        {data.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie><Tooltip content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip"><span>{payload[0].name}</span><strong>{Number(payload[0].value).toLocaleString()} {unit}</strong></div> : null} /></PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><strong>{total.toLocaleString()}</strong><span>{unit}</span></div>
            </div>
            <ul className="distribution-legend">
                {data.map((row, index) => <li key={row.name}>
                    <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} aria-hidden="true" /><span className="legend-name">{row.name}</span>
                    <strong>{row.value.toLocaleString()}</strong><span className="legend-percent">{Math.round(row.value / total * 100)}%</span>
                    <span className="legend-track" aria-hidden="true"><span style={{ width: `${row.value / total * 100}%`, background: COLORS[index % COLORS.length] }} /></span>
                </li>)}
            </ul>
        </div>}
        <div className="panel-footnote"><span className="small-status-dot" />{total === 0 ? 'Waiting for campus records' : `${total.toLocaleString()} ${unit} in this snapshot`}</div>
    </Paper>
}
const resources = [
    { title: 'People directory', description: 'Learners, staff and account access', to: '/students', icon: UsersRound },
    { title: 'Learning batches', description: 'Groups, schedules and assignments', to: '/batches', icon: Layers3 },
    { title: 'Courses & curriculum', description: 'Topics and learning programs', to: '/topics', icon: BookOpen },
    { title: 'Faculty & trainers', description: 'Your campus teaching community', to: '/trainers', icon: GraduationCap },
    { title: 'Classroom spaces', description: 'Rooms, capacity and availability', to: '/classrooms', icon: DoorOpen },
    { title: 'Audit trail', description: 'Accountability across campus', to: '/audit-logs', icon: History },
]

export default function Dashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatedAt, setUpdatedAt] = useState(null)
    const [revision, setRevision] = useState(0)
    const refresh = useCallback(() => setRevision(value => value + 1), [])
    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        dashboardAPI.getStats().then(response => {
            if (!response?.success || !response.data?.summary) throw new Error('Dashboard statistics are unavailable.')
            if (active) { setData(response.data); setUpdatedAt(new Date()) }
        }).catch(reason => { if (active) setError(typeof reason === 'string' ? reason : reason.message || 'Unable to load dashboard.') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [revision])
    const summary = data?.summary
    const cards = summary ? [
        { title: 'Total users', value: summary.totalUsers, icon: UsersRound, color: 'primary', caption: 'Across your campus community' },
        { title: 'Active users', value: summary.activeUsers, icon: UserRoundCheck, color: 'success', caption: 'Accounts currently enabled' },
        { title: 'Total batches', value: summary.totalBatches, icon: Layers3, color: 'info', caption: 'Learning groups on campus' },
        { title: 'Ongoing batches', value: summary.ongoingBatches, icon: CalendarCheck2, color: 'warning', caption: 'Programs currently in progress' },
    ] : []
    return <div className="dashboard-view">
        <section className="dashboard-heading" aria-label="Campus overview">
            <div><div className="page-eyebrow"><span />Your campus, at a glance</div><h1>Campus overview<span className="heading-period">.</span></h1><p>A clearer picture of your people, programs and everyday progress.</p></div>
            <div className="dashboard-heading-actions"><Button aria-label="Refresh overview" variant="outlined" startIcon={loading ? <CircularProgress size={14} /> : <RefreshCw size={15} strokeWidth={1.7} />} disabled={loading} onClick={refresh}>Refresh</Button><Button component={Link} to="/students" variant="contained" endIcon={<ArrowUpRight size={15} />}>Manage people</Button></div>
        </section>
        {error && <Alert severity="error" action={<Button color="inherit" disabled={loading} onClick={refresh}>Retry</Button>}>{error}{data ? ' Showing the last successful snapshot.' : ''}</Alert>}
        {loading && !data && <div className="dashboard-loading" role="status"><CircularProgress size={26} /><p>Gathering your campus overview…</p></div>}
        {summary && <>
            <div className="section-meta"><h2>Workspace summary</h2><span role="status"><span className="small-status-dot" />Updated {updatedAt?.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div className="metric-grid">{cards.map(card => <StatsCard key={card.title} {...card} />)}</div>
            <div className="analytics-section-heading"><h2>Understand your campus</h2><span>Current records · All campus</span></div>
            <div className="analytics-grid">
                <Distribution title="Campus community" description="The people behind your learning programs" rows={data.roleStats} unit="people" icon={UsersRound} />
                <Distribution title="Batch lifecycle" description="A view of every stage of learning" rows={data.batchStats} unit="batches" icon={Layers3} />
            </div>
            <Paper component="section" className="daily-pulse">
                <div className="pulse-intro"><span className="pulse-mark"><ClipboardCheck size={21} strokeWidth={1.6} /></span><div><h2>The daily pulse</h2><p>Small details. A more connected campus.</p></div></div>
                <div className="pulse-stat"><CalendarCheck2 size={17} strokeWidth={1.7} /><div><strong>{summary.todayAttendance?.toLocaleString() ?? '—'}</strong><span>Attendance sessions today</span></div></div>
                <div className="pulse-stat"><NotebookPen size={17} strokeWidth={1.7} /><div><strong>{summary.recentUpdates?.toLocaleString() ?? '—'}</strong><span>Updates in the last 7 days</span></div></div>
                <Link to="/attendance/history" className="pulse-link" aria-label="View attendance reports"><ArrowUpRight size={20} strokeWidth={1.7} /></Link>
            </Paper>
        </>}
        <section className="resource-section">
            <div className="resource-section-heading"><div><span className="page-eyebrow">MAKE ROOM FOR WHAT MATTERS</span><h2>Your campus, organised.</h2></div><p>The right tools, a little closer.</p></div>
            <div className="resource-grid">{resources.map(({ title, description, to, icon: Icon }) => <Link to={to} key={to} className="resource-card"><span className="resource-icon"><Icon size={20} strokeWidth={1.65} /></span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight className="resource-arrow" size={16} strokeWidth={1.7} /></Link>)}</div>
        </section>
        <footer className="dashboard-footer"><span>AttendEase <span> / </span> Designed for the everyday work of education.</span><span>Campus workspace <ArrowRight size={12} /></span></footer>
    </div>
}

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material'
import { Refresh, ArrowForward, People, School, CheckCircle, EventAvailable } from '@mui/icons-material'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { dashboardAPI } from '../services/api'
import StatsCard from '../components/ui/StatsCard'

const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#38bdf8', '#a78bfa', '#f472b6']
const label = value => String(value || 'Unspecified').toLowerCase().replaceAll('_', ' ')
const panel = { p: { xs: 2, sm: 3 }, borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }

function Distribution({ title, description, rows }) {
    const data = (rows || []).filter(row => row.count > 0).map(row => ({ name: label(row._id), value: row.count }))
    const total = data.reduce((sum, row) => sum + row.value, 0)
    return <Paper elevation={0} sx={panel}>
        <Typography component="h2" variant="h6" fontWeight={700}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{description}</Typography>
        {total === 0 ? <Box sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">No records to display yet.</Typography></Box> : <>
            <Box sx={{ height: 240, mt: 1 }} role="img" aria-label={`${title}: ${data.map(row => `${row.name} ${row.value}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={66} outerRadius={95} paddingAngle={3} stroke="none" isAnimationActive={false}>
                        {data.map((row, index) => <Cell key={row.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie><Tooltip formatter={value => [Number(value).toLocaleString(), 'Records']} /></PieChart>
                </ResponsiveContainer>
            </Box>
            <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                {data.map((row, index) => <li key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: COLORS[index % COLORS.length] }} />
                    <Typography variant="body2" sx={{ flex: 1, textTransform: 'capitalize' }}>{row.name}</Typography>
                    <Typography variant="body2" fontWeight={600}>{row.value.toLocaleString()} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>({Math.round(row.value / total * 100)}%)</Box></Typography>
                </li>)}
            </ul>
        </>}
    </Paper>
}

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
        }).catch(reason => {
            if (active) setError(typeof reason === 'string' ? reason : reason.message || 'Unable to load dashboard.')
        }).finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [revision])
    const summary = data?.summary
    const cards = summary ? [
        { title: 'Total users', value: summary.totalUsers, icon: People, color: 'primary' },
        { title: 'Active users', value: summary.activeUsers, icon: CheckCircle, color: 'success' },
        { title: 'Total batches', value: summary.totalBatches, icon: School, color: 'info' },
        { title: 'Ongoing batches', value: summary.ongoingBatches, icon: EventAvailable, color: 'warning' },
    ] : []
    return <Box sx={{ display: 'grid', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
            <Box><Typography variant="overline" color="primary" fontWeight={700} letterSpacing={2}>CAMPUS OPERATIONS</Typography>
                <Typography component="h1" variant="h4" fontWeight={750}>Education overview</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Your people, programs and daily activity, in one place.</Typography>
            </Box>
            <Button aria-label="Refresh overview" variant="outlined" startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} disabled={loading} onClick={refresh}>Refresh overview</Button>
        </Box>
        {error && <Alert severity="error" action={<Button color="inherit" disabled={loading} onClick={refresh}>Retry</Button>}>{error}{data ? ' Showing the last successful snapshot.' : ''}</Alert>}
        {loading && !data && <Box role="status" sx={{ py: 8, textAlign: 'center' }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading campus statistics…</Typography></Box>}
        {summary && <>
            <Typography variant="caption" color="text.secondary" role="status">Last refreshed {updatedAt?.toLocaleString()} · All campus records</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
                {cards.map(card => <StatsCard key={card.title} {...card} />)}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
                <Distribution title="Campus community" description="User accounts by assigned role, including inactive accounts." rows={data.roleStats} />
                <Distribution title="Batch lifecycle" description="All batches grouped by their current status." rows={data.batchStats} />
            </Box>
            <Paper elevation={0} sx={panel}>
                <Typography component="h2" variant="h6" fontWeight={700}>Daily pulse</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mt: 2 }}>
                    <Box><Typography variant="h4" fontWeight={700}>{summary.todayAttendance?.toLocaleString() ?? '—'}</Typography><Typography fontWeight={600}>Attendance sessions today</Typography><Typography variant="body2" color="text.secondary">Recorded batch sessions, using the server's current day.</Typography></Box>
                    <Box><Typography variant="h4" fontWeight={700}>{summary.recentUpdates?.toLocaleString() ?? '—'}</Typography><Typography fontWeight={600}>Updates in the last 7 days</Typography><Typography variant="body2" color="text.secondary">Daily updates posted across campus.</Typography></Box>
                </Box>
            </Paper>
        </>}
        <Paper elevation={0} sx={panel}>
            <Typography component="h2" variant="h6" fontWeight={700}>Manage your campus</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5, mb: 2 }}>Jump into the work behind the numbers.</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {[['People', '/students'], ['Batches', '/batches'], ['Trainers', '/trainers'], ['Classrooms', '/classrooms'], ['Courses & topics', '/topics'], ['Audit logs', '/audit-logs']].map(([name, to]) => <Button key={to} component={Link} to={to} variant="outlined" endIcon={<ArrowForward />}>{name}</Button>)}
            </Box>
            <Chip label="Campus administration" size="small" sx={{ mt: 3 }} />
        </Paper>
    </Box>
}

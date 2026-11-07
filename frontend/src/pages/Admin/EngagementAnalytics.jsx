import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Box, Button, Chip, Container, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Activity, Clock3, Download, LogIn, RefreshCw, UsersRound } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardAPI } from '../../services/api';
import { csvCell } from '../../utils/attendanceCsv';

const roles = ['ALL', 'ADMIN', 'MANAGER', 'TEAM_LEADER', 'TRAINER', 'TA', 'LEARNER'];
const roleColors = { ADMIN: '#2563EB', MANAGER: '#60A5FA', TEAM_LEADER: '#18A7B5', TRAINER: '#6C67E8', TA: '#F4A340', LEARNER: '#9CC7FF' };
const roleLabel = role => role === 'ALL' ? 'All roles' : role.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
const duration = seconds => {
  if (!seconds) return '0 min';
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const dateTime = value => value ? new Date(value).toLocaleString() : 'Never';

function Metric({ icon: Icon, label, value, hint }) {
  return <Paper sx={{ p: 2.5, flex: '1 1 210px', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
    <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}><Box sx={{ display: 'grid', placeItems: 'center', width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}><Icon size={18} /></Box><Typography color="text.secondary" fontWeight={650}>{label}</Typography></Stack>
    <Typography variant="h4" fontWeight={750}>{value}</Typography><Typography variant="body2" color="text.secondary">{hint}</Typography>
  </Paper>;
}

export default function EngagementAnalytics() {
  const [days, setDays] = useState(30);
  const [role, setRole] = useState('ALL');
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { const timer = setTimeout(() => { setSearch(draft.trim()); setPage(1); }, 300); return () => clearTimeout(timer); }, [draft]);
  const query = useQuery({ queryKey: ['dashboard', 'engagement', days, role, search, page], queryFn: async () => (await dashboardAPI.getEngagement({ days, role, search, page })).data, refetchInterval: 60_000 });
  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.pageSize)) : 1;
  const exportVisible = () => {
    if (!data?.people?.length) return;
    const rows = [
      ['Person', 'Email', 'Role', 'Last sign-in', 'Last observed', 'Sign-ins', 'Observed seconds', 'Status'],
      ...data.people.map(person => [[person.firstName, person.lastName].filter(Boolean).join(' '), person.email, person.role, person.lastLogin || '', person.lastSeenAt || '', person.sessions, person.observedSeconds, person.online ? 'Active now' : person.isActive ? 'Offline' : 'Deactivated']),
    ];
    const blob = new Blob([rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `engagement-${data.range.startDate}-to-${data.range.endDate}-page-${page}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Container maxWidth="xl" sx={{ py: 4 }}>
    <Paper sx={{ p: { xs: 2.5, md: 4 }, mb: 3, borderRadius: 3, color: '#F0F7FF', background: 'linear-gradient(120deg, #0B1F3B 10%, #123F78 70%, #2563EB 130%)', overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
        <Box><Typography variant="overline" sx={{ color: '#9CC7FF', letterSpacing: '.18em', fontWeight: 700 }}>CAMPUS INTELLIGENCE</Typography><Typography variant="h4" component="h1" sx={{ color: 'inherit', fontWeight: 750, my: 0.5 }}>Engagement analytics</Typography><Typography sx={{ color: '#DBEAFE', maxWidth: 680 }}>See who signed in, when they were last seen, and the foreground time the platform observed.</Typography></Box>
        <Button startIcon={<RefreshCw size={17} />} variant="contained" onClick={() => query.refetch()} disabled={query.isFetching} sx={{ bgcolor: '#F0F7FF', color: '#0B1F3B', '&:hover': { bgcolor: '#DBEAFE' }, alignSelf: { xs: 'flex-start', md: 'center' } }}>Refresh data</Button>
      </Stack>
    </Paper>
    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mb: 3 }}>
      <TextField select size="small" label="Period" value={days} onChange={event => { setDays(Number(event.target.value)); setPage(1); }} sx={{ minWidth: 145 }}><MenuItem value={7}>Last 7 days</MenuItem><MenuItem value={30}>Last 30 days</MenuItem><MenuItem value={90}>Last 90 days</MenuItem></TextField>
      <TextField select size="small" label="Role" value={role} onChange={event => { setRole(event.target.value); setPage(1); }} sx={{ minWidth: 170 }}>{roles.map(item => <MenuItem key={item} value={item}>{roleLabel(item)}</MenuItem>)}</TextField>
      <TextField size="small" label="Find a person" placeholder="Name, email or username" value={draft} onChange={event => setDraft(event.target.value)} inputProps={{ maxLength: 100 }} sx={{ flex: 1, maxWidth: 420 }} />
    </Stack>
    {query.isError && <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={() => query.refetch()}>Retry</Button>}>Engagement data is unavailable: {String(query.error?.message || query.error)}</Alert>}
    {query.isPending && <Typography role="status">Loading engagement analytics…</Typography>}
    {data && <>
      <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
        <Metric icon={UsersRound} label="People signed in" value={data.summary.people} hint="Distinct people in this period" />
        <Metric icon={LogIn} label="Sign-ins" value={data.summary.logins} hint="New sessions started" />
        <Metric icon={Clock3} label="Observed time" value={duration(data.summary.observedSeconds)} hint="From sessions begun in this period" />
        <Metric icon={Activity} label="Active sessions" value={data.summary.onlineSessions} hint="Sign-in or heartbeat in 90 seconds" />
      </Stack>
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2} sx={{ mb: 3 }}>
        <Paper component="section" sx={{ p: 3, flex: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, minWidth: 0 }}><Typography variant="h6" fontWeight={700}>Daily sign-ins</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>UTC dates · {data.range.startDate} to {data.range.endDate}</Typography>
          <Box role="img" aria-label={`Daily sign-in chart for ${data.range.days} days`} sx={{ height: 260 }}><ResponsiveContainer><BarChart data={data.daily}><CartesianGrid stroke="var(--campus-border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickFormatter={value => value.slice(5)} tick={{ fontSize: 11, fill: 'var(--campus-muted)' }} minTickGap={20} /><YAxis allowDecimals={false} tick={{ fill: 'var(--campus-muted)' }} /><Tooltip /><Bar dataKey="logins" name="Sign-ins" fill="#2563EB" radius={[5, 5, 0, 0]} maxBarSize={34} isAnimationActive={false} /></BarChart></ResponsiveContainer></Box>
        </Paper>
        <Paper component="section" sx={{ p: 3, flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 3, minWidth: 0 }}><Typography variant="h6" fontWeight={700}>Who signed in</Typography><Typography variant="body2" color="text.secondary">Sessions by role at sign-in</Typography>
          {data.roles.length ? <><Box role="img" aria-label="Sign-ins by role pie chart" sx={{ height: 195 }}><ResponsiveContainer><PieChart><Pie data={data.roles} dataKey="logins" nameKey="role" innerRadius={53} outerRadius={78} stroke="none" isAnimationActive={false}>{data.roles.map(item => <Cell key={item.role} fill={roleColors[item.role] || '#94A3B8'} />)}</Pie><Tooltip formatter={(value, name) => [value, roleLabel(name)]} /></PieChart></ResponsiveContainer></Box><Stack gap={1}>{data.roles.map(item => <Stack key={item.role} direction="row" alignItems="center" justifyContent="space-between" gap={1}><Stack direction="row" alignItems="center" gap={1}><Box sx={{ width: 9, height: 9, borderRadius: 1, bgcolor: roleColors[item.role] || '#94A3B8' }} /><Typography variant="body2">{roleLabel(item.role)}</Typography></Stack><Typography variant="body2" fontWeight={700}>{item.logins}</Typography></Stack>)}</Stack></> : <Typography color="text.secondary" sx={{ mt: 5 }}>No tracked sign-ins in this period.</Typography>}
        </Paper>
      </Stack>
      <Paper component="section" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ p: 3 }}><Box><Typography variant="h6" fontWeight={700}>People directory</Typography><Typography variant="body2" color="text.secondary">Account activity and observed time for this period. People without tracked sessions remain visible.</Typography></Box><Stack direction="row" gap={1} alignItems="center"><Chip label={`${data.pagination.total} accounts`} variant="outlined" /><Button size="small" startIcon={<Download size={16} />} disabled={!data.people.length} onClick={exportVisible}>Export visible rows</Button></Stack></Stack>
        <TableContainer sx={{ overflowX: 'auto' }}><Table size="small" sx={{ minWidth: 800 }}><TableHead><TableRow><TableCell>Person</TableCell><TableCell>Role</TableCell><TableCell>Last sign-in</TableCell><TableCell>Last observed</TableCell><TableCell align="right">Sign-ins</TableCell><TableCell align="right">Observed time</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{data.people.map(person => <TableRow key={person._id} hover><TableCell><Stack direction="row" alignItems="center" gap={1.2}><Avatar sx={{ width: 31, height: 31, bgcolor: 'primary.main', fontSize: 12 }}>{person.firstName?.[0]}{person.lastName?.[0]}</Avatar><Box><Typography fontWeight={650}>{person.firstName} {person.lastName}</Typography><Typography variant="caption" color="text.secondary">{person.email}</Typography></Box></Stack></TableCell><TableCell>{roleLabel(person.role)}</TableCell><TableCell>{dateTime(person.lastLogin)}</TableCell><TableCell>{dateTime(person.lastSeenAt)}</TableCell><TableCell align="right">{person.sessions}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{duration(person.observedSeconds)}</TableCell><TableCell><Chip size="small" color={person.online ? 'success' : 'default'} label={person.online ? 'Active now' : person.isActive ? 'Offline' : 'Deactivated'} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>
        {!data.people.length && <Typography sx={{ p: 3 }} color="text.secondary">No people match these filters.</Typography>}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}><Typography variant="body2" color="text.secondary">Page {data.pagination.page} of {totalPages}</Typography><Stack direction="row" gap={1}><Button size="small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="small" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button></Stack></Stack>
      </Paper>
      <Alert severity="info" sx={{ mt: 3 }}>{data.measurement} “Active now” means a sign-in or heartbeat occurred within 90 seconds. Figures are not a measure of learning quality.</Alert>
    </>}
  </Container>;
}

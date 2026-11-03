import { Paper, Typography } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function AttendanceTrend({ trend }) {
  const active = trend.filter(day => day.sessionCount !== null);
  return <Paper component="section" sx={{ p: 3, mb: 3 }}><Typography variant="h6" fontWeight={700}>Recorded activity</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Blank dates mean no session was recorded. Bars count learner entries.</Typography>
    {!active.length ? <Typography color="text.secondary">No recorded sessions in this range.</Typography> : <div role="img" aria-label={`Recorded attendance activity across ${trend.length} UTC days`} style={{ width: '100%', height: 260 }}><ResponsiveContainer><BarChart data={trend.map(day => ({ ...day, entries: day.statusCounts ? Object.values(day.statusCounts).reduce((a, b) => a + b, 0) : null }))}><CartesianGrid stroke="var(--campus-border)" strokeDasharray="3 3" opacity={0.7} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--campus-muted)' }} axisLine={{ stroke: 'var(--campus-border)' }} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: 'var(--campus-muted)' }} axisLine={{ stroke: 'var(--campus-border)' }} tickLine={false} /><Tooltip /><Bar dataKey="entries" name="Learner entries" fill="#2563EB" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>}
  </Paper>;
}

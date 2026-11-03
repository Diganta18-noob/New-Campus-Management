import { Button, MenuItem, Paper, Stack, TextField } from '@mui/material';

export default function InsightsFilters({ filters, batches, onChange }) {
  const preset = days => {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    onChange({ startDate, endDate });
  };
  return <Paper sx={{ p: 2.5, mb: 3 }}><Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
    <TextField select fullWidth label="Batch" value={filters.batch} onChange={event => onChange({ batch: event.target.value })}><MenuItem value="">All batches</MenuItem>{batches.map(item => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}</TextField>
    <TextField fullWidth label="Start date (UTC)" type="date" value={filters.startDate} InputLabelProps={{ shrink: true }} onChange={event => onChange({ startDate: event.target.value })} />
    <TextField fullWidth label="End date (UTC)" type="date" value={filters.endDate} InputLabelProps={{ shrink: true }} onChange={event => onChange({ endDate: event.target.value })} />
  </Stack><Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>{[7, 30, 90].map(days => <Button key={days} size="small" variant="outlined" sx={{ color: 'var(--campus-accent)', borderColor: 'divider' }} onClick={() => preset(days)}>{days} days</Button>)}</Stack></Paper>;
}

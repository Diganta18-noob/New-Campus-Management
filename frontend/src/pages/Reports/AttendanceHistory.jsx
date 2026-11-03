import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Container, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { Download, RefreshCw } from 'lucide-react';
import { useAttendanceReport, useBatches } from '../../hooks';
import { attendanceAPI } from '../../services/api';
import { attendanceCsv, fetchAttendanceExport } from '../../utils/attendanceCsv';

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDays = () => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

export default function AttendanceHistory() {
  const [params, setParams] = useSearchParams();
  const batch = params.get('batch') || '';
  const startDate = params.get('startDate') || thirtyDays();
  const endDate = params.get('endDate') || today();
  const page = Number(params.get('page')) || 1;
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const batchesQuery = useBatches({ limit: 100 });
  const report = useAttendanceReport({ batch, startDate, endDate, page, limit: 25 });
  const batches = Array.isArray(batchesQuery.data) ? batchesQuery.data : batchesQuery.data?.data || [];
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page'); setParams(next);
  };
  const exportReport = async () => {
    setExportError(''); setExporting(true);
    const snapshot = { batch, startDate, endDate };
    try {
      const rows = await fetchAttendanceExport(attendanceAPI.getReport, snapshot, report.data.total);
      const blob = new Blob(['\ufeff', attendanceCsv(rows, { startDate, endDate })], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = `attendance_${startDate}_${endDate}_UTC.csv`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (error) { setExportError(String(error?.message || error)); }
    finally { setExporting(false); }
  };
  const summary = report.data?.summary;
  return <Container maxWidth="xl" sx={{ py: 4 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" fontWeight={750}>Attendance report</Typography><Typography color="text.secondary">Recorded learner entries across your authorized batches. Dates use UTC.</Typography></Box>
      <Button variant="outlined" startIcon={<RefreshCw size={17} />} onClick={() => report.refetch()}>Refresh</Button>
    </Stack>
    <Paper sx={{ p: 3, mb: 3 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <FormControl fullWidth><InputLabel>Batch</InputLabel><Select label="Batch" value={batch} onChange={event => setFilter('batch', event.target.value)}><MenuItem value="">All authorized batches</MenuItem>{batches.map(item => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}</Select></FormControl>
      <TextField fullWidth label="Start date (UTC)" type="date" value={startDate} onChange={event => setFilter('startDate', event.target.value)} InputLabelProps={{ shrink: true }} />
      <TextField fullWidth label="End date (UTC)" type="date" value={endDate} onChange={event => setFilter('endDate', event.target.value)} InputLabelProps={{ shrink: true }} />
      <Button variant="contained" startIcon={<Download size={17} />} disabled={!report.data?.total || exporting || report.isFetching} onClick={exportReport}>{exporting ? 'Exporting…' : 'Export CSV'}</Button>
    </Stack></Paper>
    {exportError && <Alert severity="error" sx={{ mb: 2 }}>{exportError}</Alert>}
    {report.isError && <Alert severity="error" sx={{ mb: 2 }}>Report unavailable: {String(report.error?.message || report.error)} <Button onClick={() => report.refetch()}>Retry</Button></Alert>}
    {report.isFetching && <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={25} /><Typography color="text.secondary">Loading current report…</Typography></Box>}
    {!report.isFetching && !report.isError && summary && <><Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mb: 2 }}><Paper sx={{ p: 2, flex: 1 }}><Typography color="text.secondary">Recorded sessions</Typography><Typography variant="h5">{summary.sessionCount}</Typography></Paper><Paper sx={{ p: 2, flex: 1 }}><Typography color="text.secondary">Learner entries</Typography><Typography variant="h5">{summary.entryCount}</Typography></Paper></Stack>
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>{Object.entries(summary.statusCounts).map(([status, count]) => <Chip key={status} label={`${status.replaceAll('_', ' ')} ${count}`} variant="outlined" />)}</Stack>
      {!report.data.rows.length ? <Alert severity="info">No recorded learner entries for this page and range.</Alert> : <TableContainer component={Paper}><Table size="small" sx={{ minWidth: 680 }}><TableHead><TableRow>{['Date (UTC)', 'Batch', 'Learner', 'Status', 'Remarks', 'Marked by'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{report.data.rows.map(row => <TableRow key={row.rowId}><TableCell>{String(row.date).slice(0, 10)}</TableCell><TableCell>{row.batch?.name}</TableCell><TableCell>{[row.learner?.firstName, row.learner?.lastName].filter(Boolean).join(' ')}</TableCell><TableCell>{row.status.replaceAll('_', ' ')}</TableCell><TableCell>{row.remarks || '—'}</TableCell><TableCell>{[row.markedBy?.firstName, row.markedBy?.lastName].filter(Boolean).join(' ') || '—'}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
      <Stack direction="row" justifyContent="flex-end" alignItems="center" gap={2} sx={{ mt: 2 }}><Typography variant="body2">Page {page} of {Math.max(1, Math.ceil(report.data.total / 25))}</Typography><Button disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', page - 1); setParams(next); }}>Previous</Button><Button disabled={page * 25 >= report.data.total} onClick={() => { const next = new URLSearchParams(params); next.set('page', page + 1); setParams(next); }}>Next</Button></Stack>
    </>}
  </Container>;
}

import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const labels = { NO_TRAINER: 'Assign trainer', NO_CLASSROOM: 'Assign classroom', NO_LEARNERS: 'Enroll learners', MISSING_ATTENDANCE: 'Mark planned attendance', OVERDUE_UPDATE: 'Post planned daily update' };
export default function OperationsQueue({ query, range }) {
  return <Paper component="section" sx={{ p: 3 }}><Typography variant="h6" fontWeight={700}>Operations follow-up</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Missing assignments and past scheduled class days without attendance or an update. Unscheduled days are not treated as missing.</Typography>
    {query.isFetching && <Typography>Loading setup queue…</Typography>}
    {query.isError && <Alert severity="error">Setup queue unavailable. <Button onClick={() => query.refetch()}>Retry</Button></Alert>}
    {!query.isFetching && !query.isError && !query.data?.rows.length && <Alert severity="success">No incomplete batch setup found in this range.</Alert>}
    {!query.isFetching && !query.isError && query.data?.rows.map(row => <Box key={row.batchId} sx={{ py: 2, borderTop: '1px solid', borderColor: 'divider' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}><Box><Typography fontWeight={700}>{row.name} <Typography component="span" color="text.secondary">· {row.code}</Typography></Typography><Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ my: 1 }}>{row.issues.map(issue => <Chip size="small" key={issue} label={labels[issue]} color="warning" variant="outlined" />)}</Stack><Typography variant="caption" color="text.secondary">{row.recordedSessionCount} {row.recordedSessionCount === 1 ? 'session' : 'sessions'} recorded in range</Typography></Box><Stack direction="row" gap={1} alignItems="center"><Button sx={{ color: 'var(--campus-accent)' }} component={Link} to={`/batches?focus=${row.batchId}`} size="small">Manage batch</Button><Button sx={{ color: 'var(--campus-accent)' }} component={Link} to={`/attendance/history?${new URLSearchParams({ batch: row.batchId, startDate: range.startDate, endDate: range.endDate })}`} size="small">View sessions</Button></Stack></Stack></Box>)}
    {query.data?.truncated && <Alert severity="info">Showing 100 of {query.data.total} incomplete batches. Narrow the range or select a batch.</Alert>}
  </Paper>;
}

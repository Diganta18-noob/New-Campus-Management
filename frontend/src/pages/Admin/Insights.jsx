import { useSearchParams, Link } from 'react-router-dom';
import { Alert, Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import { useBatches, useCampusInsights, useCampusOperations } from '../../hooks';
import InsightsFilters from '../../components/insights/InsightsFilters';
import AttendanceTrend from '../../components/insights/AttendanceTrend';
import OperationsQueue from '../../components/insights/OperationsQueue';

const defaults = () => ({ startDate: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10) });
export default function Insights() {
  const [params, setParams] = useSearchParams();
  const filters = { ...defaults(), ...Object.fromEntries(params), batch: params.get('batch') || '' };
  const change = patch => { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(patch)) if (value) next.set(key, value); else next.delete(key); setParams(next); };
  const batchesQuery = useBatches({ limit: 100 });
  const batches = Array.isArray(batchesQuery.data) ? batchesQuery.data : batchesQuery.data?.data || [];
  const insight = useCampusInsights(filters); const operations = useCampusOperations(filters);
  const reportUrl = `/attendance/history?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))}`;
  return <Container maxWidth="xl" sx={{ py: 4 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}><Box><Typography variant="h4" fontWeight={750}>Campus insights</Typography><Typography color="text.secondary">Attendance and batch setup, grounded in recorded campus data.</Typography></Box><Button component={Link} to={reportUrl} variant="outlined">Open source report</Button></Stack>
    <InsightsFilters filters={filters} batches={batches} onChange={change} />
    {insight.isFetching && <Typography sx={{ mb: 2 }}>Loading current insights…</Typography>}
    {insight.isError && <Alert severity="error" sx={{ mb: 2 }}>Insights unavailable: {String(insight.error?.message || insight.error)} <Button onClick={() => insight.refetch()}>Retry</Button></Alert>}
    {!insight.isFetching && !insight.isError && insight.data && <><Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mb: 2 }}><Paper sx={{ p: 2, flex: 1 }}><Typography color="text.secondary">Recorded sessions</Typography><Typography variant="h4">{insight.data.summary.sessionCount}</Typography></Paper><Paper sx={{ p: 2, flex: 1 }}><Typography color="text.secondary">Learner entries</Typography><Typography variant="h4">{insight.data.summary.entryCount}</Typography></Paper></Stack><Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 3 }}>{Object.entries(insight.data.summary.statusCounts).map(([status, count]) => <Chip key={status} variant="outlined" label={`${status.replaceAll('_', ' ')} ${count}`} />)}</Stack><AttendanceTrend trend={insight.data.trend} /></>}
    <OperationsQueue query={operations} range={filters} />
  </Container>;
}

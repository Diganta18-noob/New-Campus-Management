import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, LinearProgress, Stack, TextField, Typography } from '@mui/material';
import { api } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';

export default function CourseProgress() {
  const role = useAppSelector(selectUser)?.role;
  const canUpdate = ['ADMIN', 'TRAINER', 'TA'].includes(role);
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(''); try { const result = await api.get('/topics', { params: { limit: 100 } }); setRows(result.data); } catch (e) { setError(String(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async row => { const draft = drafts[row._id]; try { await api.patch(`/topics/${row._id}/progress`, { progressPercent: Number(draft?.percent ?? row.progressPercent), progressNote: draft?.note ?? row.progressNote ?? '' }); await load(); } catch (e) { setError(String(e)); } };
  return <Container maxWidth="lg" sx={{ py: 4 }}><Typography variant="h4" fontWeight={750}>Course progress</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Recorded completion for the courses in your batches.</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading ? <Typography role="status">Loading courses…</Typography> : rows.length ? <Stack gap={2}>{rows.map(row => <Card key={row._id} variant="outlined"><CardContent><Typography variant="h6" fontWeight={700}>{row.name}</Typography><Typography color="text.secondary">{row.batch?.name} · {row.startDate?.slice(0, 10)} to {row.endDate?.slice(0, 10)}</Typography><Stack direction="row" gap={2} alignItems="center" sx={{ my: 2 }}><LinearProgress variant="determinate" value={row.progressPercent || 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} /><Typography>{row.progressPercent || 0}%</Typography></Stack>{row.progressNote && <Typography sx={{ mb: 2 }}>{row.progressNote}</Typography>}{canUpdate && <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}><TextField size="small" type="number" label="Completion %" value={drafts[row._id]?.percent ?? row.progressPercent ?? 0} onChange={e => setDrafts({ ...drafts, [row._id]: { ...drafts[row._id], percent: e.target.value } })} inputProps={{ min: 0, max: 100 }} sx={{ width: { sm: 150 } }} /><TextField size="small" label="Progress note" value={drafts[row._id]?.note ?? row.progressNote ?? ''} onChange={e => setDrafts({ ...drafts, [row._id]: { ...drafts[row._id], note: e.target.value } })} sx={{ flex: 1 }} /><Button variant="outlined" onClick={() => save(row)}>Save</Button></Stack>}</CardContent></Card>)}</Stack> : <Typography>No courses assigned yet.</Typography>}</Container>;
}

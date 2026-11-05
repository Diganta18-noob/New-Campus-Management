import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { api } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';

export default function Enrollments() {
  const learner = useAppSelector(selectUser)?.role === 'LEARNER';
  const [rows, setRows] = useState([]);
  const [available, setAvailable] = useState([]);
  const [choice, setChoice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(''); try { const data = await api.get('/enrollments'); setRows(data.data); if (learner) { const options = await api.get('/enrollments/available'); setAvailable(options.data); } } catch (e) { setError(String(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const apply = async () => { try { await api.post('/enrollments', { batch: choice }); setChoice(''); await load(); } catch (e) { setError(String(e)); } };
  const decide = async (id, status) => { try { await api.patch(`/enrollments/${id}`, { status }); await load(); } catch (e) { setError(String(e)); } };
  return <Container maxWidth="lg" sx={{ py: 4 }}><Typography variant="h4" fontWeight={750}>Enrollment</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>{learner ? 'Request a place in an available batch.' : 'Review learner requests and available capacity.'}</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{learner && <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ mb: 3 }}><TextField select label="Available batch" size="small" value={choice} onChange={e => setChoice(e.target.value)} sx={{ minWidth: 280 }}>{available.map(batch => <MenuItem key={batch._id} value={batch._id} disabled={batch.availableSeats === 0}>{batch.name}{batch.availableSeats == null ? '' : ` · ${batch.availableSeats} seats`}</MenuItem>)}</TextField><Button variant="contained" disabled={!choice} onClick={apply}>Request enrollment</Button></Stack>}{loading ? <Typography role="status">Loading requests…</Typography> : rows.length ? <Stack gap={2}>{rows.map(row => <Card key={row._id} variant="outlined"><CardContent><Typography variant="h6">{row.batch?.name || 'Unavailable batch'}</Typography><Typography color="text.secondary">{learner ? '' : `${row.learner?.firstName || ''} ${row.learner?.lastName || ''} · `}{row.status} · Requested {new Date(row.createdAt).toLocaleDateString()}</Typography>{row.note && <Typography sx={{ mt: 1 }}>{row.note}</Typography>}{!learner && row.status === 'PENDING' && <Stack direction="row" gap={1} sx={{ mt: 2 }}><Button variant="contained" size="small" onClick={() => decide(row._id, 'APPROVED')}>Approve</Button><Button variant="outlined" color="error" size="small" onClick={() => decide(row._id, 'REJECTED')}>Reject</Button></Stack>}</CardContent></Card>)}</Stack> : <Typography>No enrollment requests yet.</Typography>}</Container>;
}

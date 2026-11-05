import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { api } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';

export default function SupportCases() {
  const learner = useAppSelector(selectUser)?.role === 'LEARNER';
  const [cases, setCases] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState({ batch: '', subject: '', message: '' });
  const [reply, setReply] = useState({});
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); setError(''); try { const data = await api.get('/support-cases'); setCases(data.data); if (learner) { const batchesData = await api.get('/batches', { params: { limit: 100 } }); setBatches(batchesData.data || []); } } catch (e) { setError(String(e)); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const create = async () => { try { await api.post('/support-cases', form); setOpen(false); setForm({ batch: '', subject: '', message: '' }); await load(); } catch (e) { setError(String(e)); } };
  const send = async id => { if (!reply[id]?.trim()) return; try { await api.post(`/support-cases/${id}/replies`, { message: reply[id] }); setReply({ ...reply, [id]: '' }); await load(); } catch (e) { setError(String(e)); } };
  const status = async (id, value) => { try { await api.patch(`/support-cases/${id}/status`, { status: value }); await load(); } catch (e) { setError(String(e)); } };
  return <Container maxWidth="lg" sx={{ py: 4 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}><Box><Typography variant="h4" fontWeight={750}>Learner support</Typography><Typography color="text.secondary">Questions, follow-ups and resolutions in one place.</Typography></Box>{learner && <Button variant="contained" onClick={() => setOpen(true)}>New request</Button>}</Stack>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{loading ? <Typography role="status">Loading support cases…</Typography> : cases.length ? <Stack gap={2}>{cases.map(row => <Card variant="outlined" key={row._id}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}><Box><Typography variant="h6" fontWeight={700}>{row.subject}</Typography><Typography color="text.secondary">{row.batch?.name} · {row.learner?.firstName} {row.learner?.lastName}</Typography></Box><Typography fontWeight={650}>{row.status.replace('_', ' ')}</Typography></Stack><Stack gap={1} sx={{ mt: 2 }}>{row.messages.map(message => <Box key={message._id} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}><Typography fontWeight={650} variant="body2">{message.author?.firstName} {message.author?.lastName}</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.body}</Typography></Box>)}</Stack><Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ mt: 2 }}><TextField size="small" fullWidth label="Reply" value={reply[row._id] || ''} onChange={e => setReply({ ...reply, [row._id]: e.target.value })} /><Button variant="outlined" disabled={!reply[row._id]?.trim()} onClick={() => send(row._id)}>Send</Button>{!learner && <TextField select size="small" label="Status" value={row.status} onChange={e => status(row._id, e.target.value)} sx={{ minWidth: 150 }}><MenuItem value="OPEN">Open</MenuItem><MenuItem value="IN_PROGRESS">In progress</MenuItem><MenuItem value="RESOLVED">Resolved</MenuItem></TextField>}</Stack></CardContent></Card>)}</Stack> : <Typography>No support requests yet.</Typography>}
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth><DialogTitle>New support request</DialogTitle><DialogContent><Stack gap={2} sx={{ pt: 1 }}><TextField required select label="Batch" value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })}>{batches.map(batch => <MenuItem key={batch._id} value={batch._id}>{batch.name}</MenuItem>)}</TextField><TextField required label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /><TextField required multiline minRows={3} label="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={!form.batch || !form.subject.trim() || !form.message.trim()} onClick={create}>Send request</Button></DialogActions></Dialog>
  </Container>;
}

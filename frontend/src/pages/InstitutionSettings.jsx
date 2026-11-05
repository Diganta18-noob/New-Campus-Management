import { useEffect, useState } from 'react';
import { Alert, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { api } from '../services/api';

export default function InstitutionSettings() {
  const [form, setForm] = useState({ name: '', contactEmail: '', retentionDays: 365 });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/settings').then(result => setForm(result.data)).catch(e => setError(String(e))).finally(() => setLoading(false)); }, []);
  const save = async () => { setError(''); setSaved(false); try { await api.put('/settings', { name: form.name, contactEmail: form.contactEmail, retentionDays: Number(form.retentionDays) }); setSaved(true); } catch (e) { setError(String(e)); } };
  return <Container maxWidth="md" sx={{ py: 4 }}><Typography variant="h4" fontWeight={750}>Institution settings</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Campus identity and records policy.</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved.</Alert>}{loading ? <Typography role="status">Loading settings…</Typography> : <Paper variant="outlined" sx={{ p: 3 }}><Stack gap={2}><TextField required label="Institution name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /><TextField type="email" label="Contact email" value={form.contactEmail || ''} onChange={e => setForm({ ...form, contactEmail: e.target.value })} /><TextField type="number" label="Record retention target (days)" value={form.retentionDays} onChange={e => setForm({ ...form, retentionDays: e.target.value })} inputProps={{ min: 30, max: 3650 }} helperText="Policy target only; records are not automatically deleted. Back up and review records before any removal." /><TextField label="Reporting time zone" value="UTC" disabled helperText="Attendance reporting uses UTC dates until institution-wide time zone migration is verified." /><Button variant="contained" onClick={save} disabled={!form.name?.trim()}>Save settings</Button></Stack></Paper>}</Container>;
}

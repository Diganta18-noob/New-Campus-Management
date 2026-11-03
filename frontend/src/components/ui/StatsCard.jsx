import { Paper } from '@mui/material'

export default function StatsCard({ icon: Icon, title, value, color = 'primary', caption }) {
    return <Paper component="article" className={`metric-card metric-${color}`}>
        <div className="metric-heading"><span>{title}</span><span className="metric-icon"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /></span></div>
        <div className="metric-value">{typeof value === 'number' ? value.toLocaleString() : value ?? '—'}</div>
        {caption && <p className="metric-caption">{caption}</p>}
    </Paper>
}

import { Paper, Typography } from '@mui/material'

const StatsCard = ({ icon: Icon, title, value, color = 'primary' }) => {
    const colorClasses = {
        primary: 'bg-primary-500 text-white',
        success: 'bg-emerald-500 text-white',
        warning: 'bg-amber-500 text-white',
        info: 'bg-blue-500 text-white',
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-4px)',
                },
            }}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
                >
                    <Icon className="text-2xl" />
                </div>
                <div>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>
                        {value}
                    </Typography>
                </div>
            </div>
        </Paper>
    )
}

export default StatsCard

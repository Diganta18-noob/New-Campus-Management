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
            className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
            <div className="flex items-center gap-4">
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]}`}
                >
                    <Icon className="text-2xl" />
                </div>
                <div>
                    <Typography variant="body2" className="text-gray-500 font-medium">
                        {title}
                    </Typography>
                    <Typography variant="h4" className="font-bold text-gray-800 mt-1">
                        {value}
                    </Typography>
                </div>
            </div>
        </Paper>
    )
}

export default StatsCard

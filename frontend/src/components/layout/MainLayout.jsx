import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

import { Box, useMediaQuery } from '@mui/material'

const MainLayout = () => {
    const compact = useMediaQuery('(max-width:800px)')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileExpanded, setMobileExpanded] = useState(false)
    const collapsed = compact ? !mobileExpanded : sidebarCollapsed

    const toggleSidebar = () => {
        if (compact) setMobileExpanded(value => !value)
        else setSidebarCollapsed(value => !value)
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', transition: 'background-color 0.2s' }}>
            <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
            {compact && mobileExpanded && <Box component="button" aria-label="Close navigation" onClick={() => setMobileExpanded(false)} sx={{ position: 'fixed', inset: 0, border: 0, bgcolor: 'rgba(0,0,0,.35)', zIndex: 40 }} />}
            <main
                className={`transition-all duration-300 ${compact || collapsed ? 'ml-20' : 'ml-64'
                    }`}
            >
                <Box sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0 }}>
                    <Outlet />
                </Box>
            </main>
        </Box>
    )
}

export default MainLayout

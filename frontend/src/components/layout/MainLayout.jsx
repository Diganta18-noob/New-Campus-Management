import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

import { Box } from '@mui/material'

const MainLayout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', transition: 'background-color 0.2s' }}>
            <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
            <main
                className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
                    }`}
            >
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </Box>
    )
}

export default MainLayout

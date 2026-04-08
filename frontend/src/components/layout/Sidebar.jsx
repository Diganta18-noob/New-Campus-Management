import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Groups as BatchIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  MoreVert as MoreVertIcon,
  MeetingRoom as ClassroomIcon,
  MenuBook as SubjectIcon,
  SupervisorAccount as TrainerIcon,
  Assistant as TAIcon,
  EventNote as AttendanceIcon,
  RateReview as DailyUpdateIcon,
  Topic as TopicIcon,
  History as AuditIcon,
  BarChart as PerformanceIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  BrightnessAuto as BrightnessAutoIcon,
} from "@mui/icons-material";
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Typography,
  ButtonBase,
  Tooltip,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectUser, logout } from "../../store/slices/authSlice";
import { useThemeMode } from "../../context/ThemeContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  // Admin & Manager
  { path: "/departments", label: "Departments", icon: SchoolIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/classrooms", label: "Classrooms", icon: ClassroomIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/batches", label: "Batches", icon: BatchIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/topics", label: "Topics / Courses", icon: TopicIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/students", label: "Users Management", icon: PeopleIcon, roles: ["ADMIN"] },
  { path: "/trainers", label: "Trainers", icon: TrainerIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/tas", label: "Teaching Assistants", icon: TAIcon, roles: ["ADMIN", "MANAGER"] },
  // Trainer & TA
  { path: "/attendance", label: "Mark Attendance", icon: AttendanceIcon, roles: ["TRAINER", "TA"] },
  { path: "/daily-updates", label: "Daily Updates", icon: DailyUpdateIcon, roles: ["TRAINER", "TA"] },
  // Manager & Team Leader
  { path: "/attendance/history", label: "Attendance Reports", icon: AttendanceIcon, roles: ["ADMIN", "MANAGER", "TEAM_LEADER"] },
  { path: "/daily-updates/review", label: "Review Updates", icon: DailyUpdateIcon, roles: ["MANAGER", "TEAM_LEADER"] },
  // Learner
  { path: "/my-attendance", label: "My Attendance", icon: AttendanceIcon, roles: ["LEARNER"] },
  { path: "/performance", label: "My Performance", icon: PerformanceIcon, roles: ["LEARNER"] },
  // Admin only
  { path: "/audit-logs", label: "Audit Logs", icon: AuditIcon, roles: ["ADMIN"] },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { themeMode, cycleThemeMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await dispatch(logout());
    navigate("/login");
  };

  const themeLabel =
    themeMode.charAt(0).toUpperCase() + themeMode.slice(1);

  const ThemeIcon =
    themeMode === "light"
      ? LightModeIcon
      : themeMode === "dark"
        ? DarkModeIcon
        : BrightnessAutoIcon;

  return (
    <Box
      component="aside"
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        transition: 'all 0.3s',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        width: collapsed ? 80 : 256
      }}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {collapsed ? (
          <IconButton size="small" onClick={onToggle} className={isDark ? "text-gray-300" : "text-gray-500"}>
            <MenuIcon />
          </IconButton>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className={`font-bold text-lg ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>AttendEase</h1>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Classroom Management</p>
              </div>
            </div>
            <IconButton
              size="small"
              onClick={onToggle}
              className={isDark ? "text-gray-300" : "text-gray-500"}
            >
              <ChevronLeftIcon />
            </IconButton>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                        : `${isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <Icon className="text-xl" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Tooltip title={`Theme: ${themeLabel}`} placement="right">
          <ButtonBase
            onClick={cycleThemeMode}
            sx={{
              width: '100%',
              borderRadius: '12px',
              transition: 'all 0.2s',
              border: '1px solid',
              borderColor: isDark ? 'rgba(55,65,81,1)' : 'rgba(229,231,235,1)',
              '&:hover': {
                bgcolor: isDark ? 'rgba(31,41,55,1)' : 'rgba(243,244,246,1)',
              },
              justifyContent: collapsed ? 'center' : 'flex-start',
              minWidth: collapsed ? 0 : undefined,
              px: collapsed ? 0 : 1.5,
              py: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', color: isDark ? 'rgba(229,231,235,1)' : 'rgba(55,65,81,1)' }}>
              <ThemeIcon fontSize="small" />
              {!collapsed && (
                <>
                  <span style={{ fontWeight: 500 }}>Theme</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: isDark ? 'rgba(156,163,175,1)' : 'rgba(107,114,128,1)' }}>{themeLabel}</span>
                </>
              )}
            </Box>
          </ButtonBase>
        </Tooltip>
      </Box>

      {/* User Profile Section */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(31,41,55,1)' : 'rgba(243,244,246,1)' }}>
        <ButtonBase
          onClick={handleMenuOpen}
          sx={{
            width: '100%',
            borderRadius: '12px',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: isDark ? 'rgba(31,41,55,1)' : 'rgba(249,250,251,1)',
            },
            justifyContent: collapsed ? 'center' : 'flex-start',
            minWidth: collapsed ? 0 : undefined,
            px: collapsed ? 0 : 1.5,
            py: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <Avatar
              alt={user?.firstName || "User"}
              src={user?.avatar}
              sx={{ width: 40, height: 40, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 'bold' }}
            >
              {user?.firstName?.charAt(0) || "U"}
            </Avatar>

            {!collapsed && (
              <Box sx={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? 'rgba(243,244,246,1)' : 'rgba(31,41,55,1)' }}
                >
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isDark ? 'rgba(156,163,175,1)' : 'rgba(107,114,128,1)' }}
                >
                  {user?.role?.replace("_", " ")}
                </Typography>
              </Box>
            )}

            {!collapsed && <MoreVertIcon sx={{ fontSize: '1rem', color: isDark ? 'rgba(107,114,128,1)' : 'rgba(156,163,175,1)' }} />}
          </Box>
        </ButtonBase>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                bottom: 0,
                left: 14, // Adjust based on sidebar
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(50%) rotate(45deg)",
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: "left", vertical: "bottom" }}
          anchorOrigin={{ horizontal: "left", vertical: "top" }}
        >
          <MenuItem onClick={() => navigate("/profile")}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Sidebar;

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
} from "@mui/icons-material";
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Typography,
  Button,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectUser, logout } from "../../store/slices/authSlice";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { path: "/departments", label: "Departments", icon: SchoolIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/classrooms", label: "Classrooms", icon: ClassroomIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/batches", label: "Batches", icon: BatchIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/students", label: "Users Management", icon: PeopleIcon, roles: ["ADMIN"] },
  { path: "/trainers", label: "Trainers", icon: TrainerIcon, roles: ["ADMIN", "MANAGER"] },
  { path: "/tas", label: "Teaching Assistants", icon: TAIcon, roles: ["ADMIN", "MANAGER"] },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

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

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center p-4 border-b border-gray-100 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {collapsed ? (
          <IconButton size="small" onClick={onToggle} className="text-gray-500">
            <MenuIcon />
          </IconButton>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800 text-lg">AttendEase</h1>
                <p className="text-xs text-gray-500">Classroom Management</p>
              </div>
            </div>
            <IconButton
              size="small"
              onClick={onToggle}
              className="text-gray-500"
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
                        : "text-gray-600 hover:bg-gray-100"
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

      {/* User Profile Section */}
      <div className="p-3 border-t border-gray-100">
        <Button
          onClick={handleMenuOpen}
          className={`w-full rounded-xl transition-all duration-200 hover:bg-gray-50 ${
            collapsed
              ? "justify-center min-w-0 px-0"
              : "justify-start px-3 py-2"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <Avatar
              alt={user?.firstName || "User"}
              src={user?.avatar}
              className={`${collapsed ? "w-10 h-10" : "w-10 h-10"} bg-primary-100 text-primary-700 font-bold`}
            >
              {user?.firstName?.charAt(0) || "U"}
            </Avatar>

            {!collapsed && (
              <div className="flex-1 text-left overflow-hidden">
                <Typography
                  variant="subtitle2"
                  className="font-semibold text-gray-800 truncate"
                >
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography
                  variant="caption"
                  className="text-gray-500 truncate block"
                >
                  {user?.role?.replace("_", " ")}
                </Typography>
              </div>
            )}

            {!collapsed && <MoreVertIcon className="text-gray-400 text-sm" />}
          </div>
        </Button>

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
      </div>
    </aside>
  );
};

export default Sidebar;

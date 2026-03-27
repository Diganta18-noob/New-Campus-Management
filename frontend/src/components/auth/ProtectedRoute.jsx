import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectUser, selectIsAuthenticated, selectAuthLoading, selectRequiresPasswordReset } from '../../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

// Protected Route - requires authentication
export const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const loading = useAppSelector(selectAuthLoading);
    const requiresPasswordReset = useAppSelector(selectRequiresPasswordReset);
    const location = useLocation();

    if (loading) {
        return (
            <Box className="min-h-screen flex items-center justify-center">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If password reset is required and we're not already on the reset page
    if (requiresPasswordReset && location.pathname !== '/reset-password') {
        return <Navigate to="/reset-password" replace />;
    }

    return children;
};

// Admin Route - requires admin role
export const AdminRoute = ({ children }) => {
    const user = useAppSelector(selectUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const loading = useAppSelector(selectAuthLoading);
    const location = useLocation();

    if (loading) {
        return (
            <Box className="min-h-screen flex items-center justify-center">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has admin role
    if (user?.role !== 'ADMIN') {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// Role-based Route - requires specific roles
export const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
    const user = useAppSelector(selectUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const loading = useAppSelector(selectAuthLoading);
    const requiresPasswordReset = useAppSelector(selectRequiresPasswordReset);
    const location = useLocation();

    if (loading) {
        return (
            <Box className="min-h-screen flex items-center justify-center">
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If password reset is required, redirect to reset page
    if (requiresPasswordReset) {
        return <Navigate to="/reset-password" replace />;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;


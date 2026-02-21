import { Paper, Typography, Button, CircularProgress, Box } from '@mui/material';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '../store/slices/authSlice';

const Unauthorized = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const loading = useAppSelector(selectAuthLoading);

    // Show loading while checking auth
    if (loading) {
        return (
            <Box className="min-h-screen flex items-center justify-center">
                <CircularProgress />
            </Box>
        );
    }

    // If not authenticated (no token), redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
            <Paper
                elevation={0}
                className="w-full max-w-md p-10 rounded-3xl border border-gray-100 text-center"
            >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockIcon className="text-red-500 text-4xl" style={{ fontSize: '2.5rem' }} />
                </div>
                <Typography variant="h4" className="font-bold text-gray-800 mb-2">
                    Access Denied
                </Typography>
                <Typography variant="body1" className="text-gray-500 mb-6">
                    You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                </Typography>
                <div className="space-y-3">
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => navigate('/dashboard')}
                        className="bg-primary-500 hover:bg-primary-600 py-3"
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/login')}
                        className="py-3"
                    >
                        Sign In with Different Account
                    </Button>
                </div>
            </Paper>
        </div>
    );
};

export default Unauthorized;


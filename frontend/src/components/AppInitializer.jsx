import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { checkAuth } from '../store/slices/authSlice';

/**
 * AppInitializer component that runs initialization logic on app mount.
 * Dispatches checkAuth to verify if user is already logged in.
 */
const AppInitializer = ({ children }) => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    return children;
};

export default AppInitializer;

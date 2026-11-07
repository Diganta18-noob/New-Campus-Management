import { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectRequiresPasswordReset } from '../store/slices/authSlice';
import { authAPI } from '../services/api';

export default function SessionPulse() {
  const authenticated = useAppSelector(selectIsAuthenticated);
  const resetRequired = useAppSelector(selectRequiresPasswordReset);

  useEffect(() => {
    if (!authenticated || resetRequired) return;
    let lastInteraction = Date.now();
    const markInteraction = () => { lastInteraction = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(name => window.addEventListener(name, markInteraction, { passive: true }));
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus() && Date.now() - lastInteraction < 120_000) {
        authAPI.heartbeat().catch(() => {});
      }
    }, 30_000);
    return () => {
      window.clearInterval(timer);
      events.forEach(name => window.removeEventListener(name, markInteraction));
    };
  }, [authenticated, resetRequired]);

  return null;
}

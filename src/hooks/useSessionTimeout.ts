import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logoutUser } from '@/store/authSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';

interface UseSessionTimeoutOptions {
  timeoutDuration?: number; // in milliseconds
  warningDuration?: number; // warning before logout
  onWarning?: () => void;
  onTimeout?: () => void;
}

export const useSessionTimeout = (options: UseSessionTimeoutOptions = {}) => {
  const {
    timeoutDuration = 30 * 60 * 1000, // 30 minutes default
    warningDuration = 5 * 60 * 1000,   // 5 minutes warning
    onWarning,
    onTimeout
  } = options;

  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Only set timeouts if user is logged in
    if (!user) return;

    // Set warning timeout
    warningRef.current = setTimeout(() => {
      onWarning?.();
    }, timeoutDuration - warningDuration);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Session timeout - logging out user');
      dispatch(logoutUser());
      onTimeout?.();
    }, timeoutDuration);
  }, [dispatch, user, timeoutDuration, warningDuration, onWarning, onTimeout]);

  const handleActivity = useCallback(() => {
    if (user) {
      resetTimeout();
    }
  }, [user, resetTimeout]);

  useEffect(() => {
    if (!user) {
      // Clear timeouts when user logs out
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Start timeout when user logs in
    resetTimeout();

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, handleActivity, resetTimeout]);

  return {
    resetTimeout,
    getTimeRemaining: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeoutDuration - elapsed);
    },
    getLastActivity: () => lastActivityRef.current
  };
};

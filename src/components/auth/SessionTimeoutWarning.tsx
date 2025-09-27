import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { authTimeoutService } from '@/services/authTimeoutService';

export function SessionTimeoutWarning() {
  const [isVisible, setIsVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const handleWarning = (event: CustomEvent) => {
      setRemainingTime(event.detail.remainingTime);
      setIsVisible(true);
    };

    const handleLogout = () => {
      setIsVisible(false);
    };

    window.addEventListener('auth-timeout-warning', handleWarning as EventListener);
    window.addEventListener('auth-timeout-logout', handleLogout);

    return () => {
      window.removeEventListener('auth-timeout-warning', handleWarning as EventListener);
      window.removeEventListener('auth-timeout-logout', handleLogout);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const remaining = authTimeoutService.getRemainingTime();
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        setIsVisible(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    authTimeoutService.extendSession();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </CardTitle>
          <CardDescription>
            Your session will expire automatically for security reasons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Time remaining: {formatTime(remainingTime)}</strong>
              <br />
              You will be automatically logged out when the timer reaches zero.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={handleExtendSession}
              className="flex-1"
            >
              Stay Logged In
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsVisible(false)}
              className="flex-1"
            >
              Logout Now
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Sessions automatically expire after 1 hour of inactivity for your security.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

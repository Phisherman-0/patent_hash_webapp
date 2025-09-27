import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  isOpen,
  timeRemaining,
  onExtendSession,
  onLogout
}: SessionTimeoutWarningProps) {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(timeRemaining);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          onLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeRemaining, onLogout]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Session Timeout Warning
          </DialogTitle>
          <DialogDescription>
            Your session will expire due to inactivity. You will be automatically logged out in:
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2 text-2xl font-mono font-bold text-amber-600">
            <Clock className="h-6 w-6" />
            {formatTime(countdown)}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onLogout}>
            Logout Now
          </Button>
          <Button onClick={onExtendSession}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

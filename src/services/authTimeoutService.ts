import { store } from '@/store';
import { logoutUser } from '@/store/authSlice';

class AuthTimeoutService {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly WARNING_DURATION = 55 * 60 * 1000; // 55 minutes - warn 5 minutes before logout
  private lastActivity = Date.now();
  private isActive = false;

  constructor() {
    this.setupActivityListeners();
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => {
      this.lastActivity = Date.now();
      if (this.isActive) {
        this.resetTimeout();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    this.resetTimeout();
  }

  stop() {
    this.isActive = false;
    this.clearTimeouts();
  }

  private resetTimeout() {
    this.clearTimeouts();
    
    // Set warning timeout (5 minutes before logout)
    this.warningTimeoutId = setTimeout(() => {
      this.showWarning();
    }, this.WARNING_DURATION);

    // Set logout timeout (1 hour)
    this.timeoutId = setTimeout(() => {
      this.performLogout();
    }, this.TIMEOUT_DURATION);
  }

  private clearTimeouts() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  private showWarning() {
    // Create a custom event for the warning
    const warningEvent = new CustomEvent('auth-timeout-warning', {
      detail: { remainingTime: 5 * 60 * 1000 } // 5 minutes remaining
    });
    window.dispatchEvent(warningEvent);
  }

  private performLogout() {
    // Create a custom event for automatic logout
    const logoutEvent = new CustomEvent('auth-timeout-logout');
    window.dispatchEvent(logoutEvent);
    
    // Dispatch logout action
    store.dispatch(logoutUser());
  }

  getRemainingTime(): number {
    if (!this.isActive) return 0;
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.TIMEOUT_DURATION - elapsed);
  }

  extendSession() {
    if (this.isActive) {
      this.lastActivity = Date.now();
      this.resetTimeout();
    }
  }
}

export const authTimeoutService = new AuthTimeoutService();

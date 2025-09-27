/**
 * HashPack Wallet Connection Troubleshooter
 * Comprehensive diagnostic and fix utility for HashPack wallet connection issues
 */

export interface DiagnosticResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  solution?: string;
  action?: () => void;
}

export class HashPackTroubleshooter {
  private results: DiagnosticResult[] = [];

  /**
   * Run comprehensive diagnostics
   */
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    this.results = [];
    
    console.log('🔍 Running HashPack Connection Diagnostics...');
    
    // Check browser compatibility
    this.checkBrowserCompatibility();
    
    // Check extension installation
    this.checkExtensionInstallation();
    
    // Check extension permissions
    this.checkExtensionPermissions();
    
    // Check network connectivity
    await this.checkNetworkConnectivity();
    
    // Check localStorage availability
    this.checkLocalStorage();
    
    // Check for conflicting extensions
    this.checkConflictingExtensions();
    
    // Check HashPack service state
    this.checkHashPackServiceState();
    
    // Check for common errors
    this.checkCommonErrors();
    
    console.log('✅ Diagnostics complete:', this.results);
    return this.results;
  }

  /**
   * Check browser compatibility
   */
  private checkBrowserCompatibility(): void {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(userAgent);
    const isEdge = /Edg/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    if (isChrome || isFirefox || isEdge) {
      this.results.push({
        category: 'Browser Compatibility',
        status: 'pass',
        message: `Compatible browser detected: ${this.getBrowserName()}`
      });
    } else if (isSafari) {
      this.results.push({
        category: 'Browser Compatibility',
        status: 'warning',
        message: 'Safari detected - HashPack extension may have limited support',
        solution: 'Consider using Chrome, Firefox, or Edge for better compatibility'
      });
    } else {
      this.results.push({
        category: 'Browser Compatibility',
        status: 'fail',
        message: 'Unsupported browser detected',
        solution: 'Please use Chrome, Firefox, or Edge browser'
      });
    }
  }

  /**
   * Check extension installation
   */
  private checkExtensionInstallation(): void {
    // Only check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.results.push({
        category: 'Extension Installation',
        status: 'warning',
        message: 'Not in browser environment, cannot check extension installation'
      });
      return;
    }

    const extensionLocations = [
      { name: 'window.hashpack', obj: (window as any).hashpack },
      { name: 'window.HashPack', obj: (window as any).HashPack },
      { name: 'window.hashConnect', obj: (window as any).hashConnect },
      { name: 'window.hedera', obj: (window as any).hedera }
    ];

    const foundExtensions = extensionLocations.filter(loc => loc.obj);
    
    if (foundExtensions.length > 0) {
      this.results.push({
        category: 'Extension Installation',
        status: 'pass',
        message: `HashPack extension found at: ${foundExtensions.map(e => e.name).join(', ')}`
      });
      
      // Check extension methods
      foundExtensions.forEach(ext => {
        try {
          const methods = Object.getOwnPropertyNames(ext.obj);
          this.results.push({
            category: 'Extension Methods',
            status: 'pass',
            message: `Available methods in ${ext.name}: ${methods.join(', ')}`
          });
        } catch (error) {
          this.results.push({
            category: 'Extension Methods',
            status: 'warning',
            message: `Could not inspect methods in ${ext.name}: ${error.message}`
          });
        }
      });
    } else {
      this.results.push({
        category: 'Extension Installation',
        status: 'fail',
        message: 'HashPack extension not detected',
        solution: 'Install HashPack extension from https://www.hashpack.app/download',
        action: () => {
          if (typeof window !== 'undefined') {
            window.open('https://www.hashpack.app/download', '_blank');
          }
        }
      });
    }
  }

  /**
   * Check extension permissions
   */
  private checkExtensionPermissions(): void {
    // Check if we can access extension APIs
    try {
      if ((window as any).hashpack) {
        const extension = (window as any).hashpack;
        if (typeof extension === 'object') {
          this.results.push({
            category: 'Extension Permissions',
            status: 'pass',
            message: 'Extension object accessible'
          });
        }
      } else {
        this.results.push({
          category: 'Extension Permissions',
          status: 'warning',
          message: 'Extension permissions may be restricted',
          solution: 'Check browser extension settings and ensure HashPack is enabled'
        });
      }
    } catch (error) {
      this.results.push({
        category: 'Extension Permissions',
        status: 'fail',
        message: `Permission error: ${error}`,
        solution: 'Check browser extension permissions for HashPack'
      });
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkConnectivity(): Promise<void> {
    try {
      // Test connection to Hedera networks
      const testUrls = [
        'https://testnet.mirrornode.hedera.com/api/v1/network/nodes',
        'https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes'
      ];

      for (const url of testUrls) {
        try {
          const response = await fetch(url, { 
            method: 'HEAD',
            mode: 'no-cors' // Avoid CORS issues for connectivity test
          });
          this.results.push({
            category: 'Network Connectivity',
            status: 'pass',
            message: `Connection to ${url.includes('testnet') ? 'Testnet' : 'Mainnet'} successful`
          });
        } catch (error) {
          this.results.push({
            category: 'Network Connectivity',
            status: 'warning',
            message: `Connection to ${url.includes('testnet') ? 'Testnet' : 'Mainnet'} failed`,
            solution: 'Check internet connection and firewall settings'
          });
        }
      }
    } catch (error) {
      this.results.push({
        category: 'Network Connectivity',
        status: 'fail',
        message: `Network test failed: ${error}`,
        solution: 'Check internet connection'
      });
    }
  }

  /**
   * Check localStorage availability
   */
  private checkLocalStorage(): void {
    try {
      const testKey = 'hashpack-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      this.results.push({
        category: 'Local Storage',
        status: 'pass',
        message: 'localStorage is available'
      });

      // Check for existing HashPack data
      const existingData = localStorage.getItem('hashpack-connection');
      if (existingData) {
        try {
          const parsed = JSON.parse(existingData);
          this.results.push({
            category: 'Saved Connection',
            status: 'pass',
            message: `Found saved connection for account: ${parsed.accountId}`,
            solution: 'You can try clearing saved data if experiencing issues',
            action: () => {
              localStorage.removeItem('hashpack-connection');
              window.location.reload();
            }
          });
        } catch (error) {
          this.results.push({
            category: 'Saved Connection',
            status: 'warning',
            message: 'Found corrupted saved connection data',
            solution: 'Clear corrupted data',
            action: () => {
              localStorage.removeItem('hashpack-connection');
              window.location.reload();
            }
          });
        }
      }
    } catch (error) {
      this.results.push({
        category: 'Local Storage',
        status: 'fail',
        message: 'localStorage is not available',
        solution: 'Enable localStorage in browser settings or disable private browsing'
      });
    }
  }

  /**
   * Check for conflicting extensions
   */
  private checkConflictingExtensions(): void {
    // Only check if we're in a browser environment
    if (typeof window === 'undefined') {
      this.results.push({
        category: 'Extension Conflicts',
        status: 'pass',
        message: 'Not in browser environment, skipping conflict check'
      });
      return;
    }

    const potentialConflicts = [
      { name: 'MetaMask', obj: (window as any).ethereum },
      { name: 'WalletConnect', obj: (window as any).walletConnect },
      { name: 'Phantom', obj: (window as any).phantom },
      { name: 'Solana', obj: (window as any).solana }
    ];

    const conflicts = potentialConflicts.filter(ext => ext.obj);
    
    if (conflicts.length > 0) {
      this.results.push({
        category: 'Extension Conflicts',
        status: 'warning',
        message: `Other wallet extensions detected: ${conflicts.map(c => c.name).join(', ')}`,

        solution: 'Disable other wallet extensions temporarily if experiencing connection issues'
      });
    } else {
      this.results.push({
        category: 'Extension Conflicts',
        status: 'pass',
        message: 'No conflicting wallet extensions detected'
      });
    }
  }

  /**
   * Check HashPack service state
   */
  private checkHashPackServiceState(): void {
    try {
      // Import and check service state
      import('@/services/hashPackService').then(({ hashPackService }) => {
        const state = hashPackService.getState();
        const walletInfo = hashPackService.getWalletInfo();
        const isExtensionAvailable = hashPackService.isExtensionAvailable();

        this.results.push({
          category: 'Service State',
          status: 'pass',
          message: `HashPack service state: ${state}, Extension available: ${isExtensionAvailable}`
        });

        if (walletInfo) {
          this.results.push({
            category: 'Wallet Info',
            status: 'pass',
            message: `Connected to account: ${walletInfo.accountId} on ${walletInfo.network}`
          });
        }
      });
    } catch (error) {
      this.results.push({
        category: 'Service State',
        status: 'fail',
        message: `Failed to check service state: ${error}`,
        solution: 'Try refreshing the page'
      });
    }
  }

  /**
   * Check for common errors
   */
  private checkCommonErrors(): void {
    // Check console for HashPack-related errors
    const originalConsoleError = console.error;
    const errors: string[] = [];
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.toLowerCase().includes('hashpack') || 
          message.toLowerCase().includes('hedera') ||
          message.toLowerCase().includes('wallet')) {
        errors.push(message);
      }
      originalConsoleError.apply(console, args);
    };

    // Restore original console.error after a short delay
    setTimeout(() => {
      console.error = originalConsoleError;
      
      if (errors.length > 0) {
        this.results.push({
          category: 'Console Errors',
          status: 'warning',
          message: `Found ${errors.length} wallet-related errors in console`,
          solution: 'Check browser console for detailed error messages'
        });
      } else {
        this.results.push({
          category: 'Console Errors',
          status: 'pass',
          message: 'No wallet-related errors detected in console'
        });
      }
    }, 1000);
  }

  /**
   * Get browser name
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (/Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)) return 'Chrome';
    if (/Firefox/.test(userAgent)) return 'Firefox';
    if (/Edg/.test(userAgent)) return 'Edge';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
    return 'Unknown';
  }

  /**
   * Generate troubleshooting report
   */
  generateReport(): string {
    const passCount = this.results.filter(r => r.status === 'pass').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const failCount = this.results.filter(r => r.status === 'fail').length;

    let report = `HashPack Connection Diagnostic Report\n`;
    report += `=====================================\n\n`;
    report += `Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed\n\n`;

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      report += `${icon} ${result.category}: ${result.message}\n`;
      if (result.solution) {
        report += `   Solution: ${result.solution}\n`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * Auto-fix common issues
   */
  async autoFix(): Promise<void> {
    console.log('🔧 Attempting to auto-fix common HashPack issues...');

    // Clear corrupted localStorage data
    try {
      const savedData = localStorage.getItem('hashpack-connection');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Check if data is old (more than 24 hours)
        if (parsed.sessionData?.timestamp && 
            (Date.now() - parsed.sessionData.timestamp) > 24 * 60 * 60 * 1000) {
          localStorage.removeItem('hashpack-connection');
          console.log('🧹 Cleared old connection data');
        }
      }
    } catch (error) {
      localStorage.removeItem('hashpack-connection');
      console.log('🧹 Cleared corrupted connection data');
    }

    // Reinitialize HashPack service
    try {
      const { hashPackService } = await import('@/services/hashPackService');
      await hashPackService.init();
      console.log('🔄 Reinitialized HashPack service');
    } catch (error) {
      console.error('❌ Failed to reinitialize HashPack service:', error);
    }

    // Wait for extension to load
    await this.waitForExtension();
  }

  /**
   * Wait for extension to load
   */
  private async waitForExtension(maxWait: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if ((window as any).hashpack || (window as any).HashPack) {
        console.log('✅ HashPack extension detected');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('⏰ Extension detection timeout');
    return false;
  }
}

// Export singleton instance
export const hashPackTroubleshooter = new HashPackTroubleshooter();
/**
 * Network Status Monitor - Detects online/offline status
 */
class NetworkStatus {
  constructor() {
    this.isOnline = navigator.onLine;
    this.indicator = null;
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Show indicator if already offline
    if (!this.isOnline) {
      this.showOfflineIndicator();
    }
  }

  handleOnline() {
    console.log('[Network] Back online');
    this.isOnline = true;
    this.showOnlineIndicator();
    
    // Hide indicator after 3 seconds
    setTimeout(() => {
      this.hideIndicator();
    }, 3000);
  }

  handleOffline() {
    console.log('[Network] Gone offline');
    this.isOnline = false;
    this.showOfflineIndicator();
  }

  showOfflineIndicator() {
    this.removeIndicator();
    
    this.indicator = document.createElement('div');
    this.indicator.className = 'offline-indicator';
    this.indicator.innerHTML = `
      <span>⚠️ You are offline. Showing cached content.</span>
    `;
    
    document.body.prepend(this.indicator);
  }

  showOnlineIndicator() {
    this.removeIndicator();
    
    this.indicator = document.createElement('div');
    this.indicator.className = 'offline-indicator online';
    this.indicator.innerHTML = `
      <span>✓ Back online!</span>
    `;
    
    document.body.prepend(this.indicator);
  }

  hideIndicator() {
    if (this.indicator) {
      this.indicator.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        this.removeIndicator();
      }, 300);
    }
  }

  removeIndicator() {
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.remove();
    }
    this.indicator = null;
  }
}

export default NetworkStatus;

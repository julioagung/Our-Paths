/**
 * PWA Installer - Handles install prompt and PWA installation
 */
class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.installButton = null;
    this.init();
  }

  init() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;
      // Show install button/banner
      this.showInstallPromotion();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;
      this.hideInstallPromotion();
      this.showInstalledMessage();
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      console.log('[PWA] App is running in standalone mode');
      this.hideInstallPromotion();
    }
  }

  showInstallPromotion() {
    // Create install banner if it doesn't exist
    if (!document.getElementById('pwa-install-banner')) {
      this.createInstallBanner();
    }

    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'flex';
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        if (banner && banner.style.display !== 'none') {
          banner.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => {
            banner.style.display = 'none';
          }, 300);
        }
      }, 10000);
    }
  }

  hideInstallPromotion() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.display = 'none';
    }
  }

  createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <img src="/images/logo.png" alt="Our Paths" class="pwa-install-icon">
        <div class="pwa-install-text">
          <strong>Install Our Paths</strong>
          <p>Install app for quick access and offline use</p>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-install-button" class="pwa-install-btn">Install</button>
          <button id="pwa-dismiss-button" class="pwa-dismiss-btn" aria-label="Dismiss">×</button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add event listeners
    const installBtn = document.getElementById('pwa-install-button');
    const dismissBtn = document.getElementById('pwa-dismiss-button');

    if (installBtn) {
      installBtn.addEventListener('click', () => this.promptInstall());
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => this.dismissInstallPromotion());
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return;
    }

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    this.deferredPrompt = null;
    this.hideInstallPromotion();
  }

  dismissInstallPromotion() {
    this.hideInstallPromotion();
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  showInstalledMessage() {
    // Show a success message
    const message = document.createElement('div');
    message.className = 'pwa-installed-message';
    message.innerHTML = `
      <div class="pwa-message-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>App installed successfully!</span>
      </div>
    `;

    document.body.appendChild(message);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      message.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        message.remove();
      }, 300);
    }, 3000);
  }

  // Check if install promotion should be shown
  shouldShowPromotion() {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return true;

    // Show again after 7 days
    const dismissedTime = parseInt(dismissed);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedTime > sevenDays;
  }
}

export default PWAInstaller;

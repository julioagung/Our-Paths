// CSS imports
import '../styles/styles.css';
import App from './pages/app.js';
import PushNotificationManager from './utils/push-notification.js';
import PWAInstaller from './utils/pwa-installer.js';
import NetworkStatus from './utils/network-status.js';
import dbManager from './data/indexed-db.js';
import syncManager from './data/sync-manager.js';
import favoritesManager from './data/favorites-manager.js';

// Initialize PWA features
const pwaInstaller = new PWAInstaller();
const networkStatus = new NetworkStatus();

// Initialize IndexedDB and managers
let managersInitialized = false;
const initializeManagers = async () => {
  try {
    await dbManager.init();
    await syncManager.init();
    await favoritesManager.init();
    managersInitialized = true;
    console.log('[App] IndexedDB and managers initialized');
  } catch (error) {
    console.error('[App] Failed to initialize managers:', error);
    managersInitialized = true; // Continue even if init fails
  }
};

// Start initialization immediately
initializeManagers();

// Register service worker on load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await PushNotificationManager.registerServiceWorker();
      console.log('[App] Service Worker registered successfully');
      
      // Check for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] Service Worker updated, reloading page...');
        window.location.reload();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'GET_TOKEN') {
          // Send token back to service worker
          const token = localStorage.getItem('token');
          event.ports[0].postMessage({ token });
        } else if (event.data.type === 'SYNC_COMPLETE') {
          console.log('[App] Sync complete:', event.data);
          // Show notification to user
          if (event.data.synced > 0) {
            showSyncNotification(`✅ Synced ${event.data.synced} stories successfully!`);
          }
        }
      });
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
    }
  });
}

function showSyncNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'sync-notification success';
  notification.innerHTML = `
    <span class="notification-icon">✅</span>
    <span class="notification-message">${message}</span>
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for managers to initialize
  while (!managersInitialized) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const isLoggedIn = !!localStorage.getItem('token');
  const currentHash = window.location.hash;
  
  // Hide header and footer initially if not logged in
  const header = document.querySelector('header');
  const footer = document.querySelector('.footer');
  const mainContent = document.querySelector('.main-content');
  
  if (!isLoggedIn && !currentHash.includes('register')) {
    header.style.display = 'none';
    footer.style.display = 'none';
    mainContent.style.margin = '0';
    mainContent.style.padding = '0';
    mainContent.style.borderRadius = '0';
    mainContent.style.boxShadow = 'none';
    mainContent.style.minHeight = '100vh';
  }

  const app = new App({
    content: mainContent,
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  // Check if user is logged in, if not redirect to login
  if (!isLoggedIn && !currentHash.includes('register') && !currentHash.includes('login')) {
    window.location.hash = '#/login';
  }

  // If no hash, set default based on auth status
  if (!currentHash || currentHash === '#') {
    window.location.hash = isLoggedIn ? '#/' : '#/login';
  }

  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});

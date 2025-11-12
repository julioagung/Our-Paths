// CSS imports
import '../styles/styles.css';
import App from './pages/app.js';
import PushNotificationManager from './utils/push-notification.js';
import PWAInstaller from './utils/pwa-installer.js';
import NetworkStatus from './utils/network-status.js';

// Initialize PWA features
const pwaInstaller = new PWAInstaller();
const networkStatus = new NetworkStatus();

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
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
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

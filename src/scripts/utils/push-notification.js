// Push Notification Utility
const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY'; // Replace with actual key

class PushNotificationManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }

  // Check if push notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if notifications are granted
  isGranted() {
    return Notification.permission === 'granted';
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Register service worker
  async registerServiceWorker() {
    if (!this.isSupported()) {
      throw new Error('Service Worker not supported');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('[Push] Service Worker registered:', this.registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return this.registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('[Push] Already subscribed');
        return this.subscription;
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });

      console.log('[Push] Subscribed:', this.subscription);
      
      // Save subscription to localStorage
      localStorage.setItem('pushSubscription', JSON.stringify(this.subscription));
      
      return this.subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      this.subscription = await this.registration?.pushManager.getSubscription();
    }

    if (this.subscription) {
      await this.subscription.unsubscribe();
      localStorage.removeItem('pushSubscription');
      this.subscription = null;
      console.log('[Push] Unsubscribed');
      return true;
    }
    
    return false;
  }

  // Check if currently subscribed
  async isSubscribed() {
    if (!this.registration) {
      try {
        this.registration = await navigator.serviceWorker.getRegistration();
      } catch (error) {
        return false;
      }
    }

    if (!this.registration) {
      return false;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return !!this.subscription;
  }

  // Show a test notification
  async showTestNotification(title, body, data = {}) {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    await this.registration.showNotification(title, {
      body,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      tag: 'test-notification',
      data,
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ],
      vibrate: [200, 100, 200]
    });
  }

  // Simulate push notification (for testing without server)
  async simulatePush(data) {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    // Send message to service worker to show notification
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: data.title || 'Our Paths',
        body: data.body || 'New story available!',
        icon: data.icon || '/images/logo.png',
        data: data
      });
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export default new PushNotificationManager();

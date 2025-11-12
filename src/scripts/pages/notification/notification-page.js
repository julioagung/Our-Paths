import PushNotificationManager from '../../utils/push-notification.js';

export default class NotificationPage {
  constructor() {
    this.notifications = this.loadNotifications();
    this.updateInterval = null;
    this.pushManager = PushNotificationManager;
  }

  loadNotifications() {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default welcome notification
    const defaultNotifications = [
      {
        id: Date.now(),
        type: 'welcome',
        title: 'Welcome to Our Paths!',
        message: 'Start sharing your stories with the world.',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
    this.saveNotifications(defaultNotifications);
    return defaultNotifications;
  }

  saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  addNotification(type, title, message) {
    const notification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications.unshift(notification);
    this.saveNotifications(this.notifications);
    this.renderNotifications();
  }

  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications(this.notifications);
      this.renderNotifications();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications(this.notifications);
    this.renderNotifications();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications(this.notifications);
    this.renderNotifications();
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  getNotificationIcon(type) {
    const icons = {
      welcome: '👋',
      story: '📖',
      login: '🔐',
      logout: '👋',
      register: '✨',
      add: '➕',
      error: '❌',
      success: '✅',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }

  async render() {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    const isPushSupported = this.pushManager.isSupported();
    const isPushEnabled = await this.pushManager.isSubscribed();
    
    return `
      <section class="container">
        <div class="notification-header">
          <h1>Notifications ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}</h1>
          <div class="notification-actions">
            <button id="mark-all-read" class="btn-secondary">Mark All as Read</button>
            <button id="clear-all" class="btn-danger">Clear All</button>
          </div>
        </div>

        ${isPushSupported ? `
        <div class="push-notification-card">
          <div class="push-card-header">
            <div class="push-icon">🔔</div>
            <div class="push-info">
              <h3>Push Notifications</h3>
              <p>Get notified when new stories are added</p>
            </div>
            <label class="push-toggle">
              <input type="checkbox" id="push-toggle" ${isPushEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="push-status" id="push-status">
            <span class="status-indicator ${isPushEnabled ? 'active' : ''}"></span>
            <span class="status-text">${isPushEnabled ? 'Push notifications enabled' : 'Push notifications disabled'}</span>
          </div>
          ${isPushEnabled ? `
          <div class="push-actions">
            <button id="test-notification" class="btn-test">
              <span>🧪</span> Test Notification
            </button>
          </div>
          ` : ''}
        </div>
        ` : `
        <div class="push-notification-card disabled">
          <div class="push-card-header">
            <div class="push-icon">⚠️</div>
            <div class="push-info">
              <h3>Push Notifications Not Supported</h3>
              <p>Your browser doesn't support push notifications</p>
            </div>
          </div>
        </div>
        `}
        
        <div class="notification-filters">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="unread">Unread</button>
          <button class="filter-btn" data-filter="story">Stories</button>
          <button class="filter-btn" data-filter="system">System</button>
        </div>

        <div id="notification-list" class="notification-list">
          ${this.renderNotificationItems()}
        </div>
      </section>
    `;
  }

  renderNotificationItems(filter = 'all') {
    let filtered = this.notifications;

    if (filter === 'unread') {
      filtered = this.notifications.filter(n => !n.read);
    } else if (filter === 'story') {
      filtered = this.notifications.filter(n => ['story', 'add'].includes(n.type));
    } else if (filter === 'system') {
      filtered = this.notifications.filter(n => ['login', 'logout', 'register', 'welcome'].includes(n.type));
    }

    if (filtered.length === 0) {
      return `
        <div class="empty-state">
          <p>📭 No notifications yet</p>
        </div>
      `;
    }

    return filtered.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}" data-type="${notification.type}">
        <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
        <div class="notification-content">
          <h3>${notification.title}</h3>
          <p>${notification.message}</p>
          <small class="notification-time">${this.getTimeAgo(notification.timestamp)}</small>
        </div>
        ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `).join('');
  }

  renderNotifications() {
    const listElement = document.getElementById('notification-list');
    if (listElement) {
      const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
      listElement.innerHTML = this.renderNotificationItems(activeFilter);
      this.attachNotificationListeners();
    }
  }

  attachNotificationListeners() {
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id);
        this.markAsRead(id);
      });
    });
  }

  startLiveUpdate() {
    // Simulate live updates - check for new activities every 30 seconds
    this.updateInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000);
  }

  stopLiveUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  checkForUpdates() {
    // Check localStorage for activity logs
    const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const lastCheck = localStorage.getItem('lastNotificationCheck') || new Date(0).toISOString();
    
    const newActivities = activityLog.filter(activity => 
      new Date(activity.timestamp) > new Date(lastCheck)
    );

    newActivities.forEach(activity => {
      this.addNotification(activity.type, activity.title, activity.message);
    });

    localStorage.setItem('lastNotificationCheck', new Date().toISOString());
  }

  async afterRender() {
    // Setup push notification toggle
    await this.setupPushNotification();

    // Mark all as read button
    const markAllBtn = document.getElementById('mark-all-read');
    markAllBtn?.addEventListener('click', () => {
      this.markAllAsRead();
    });

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all');
    clearAllBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all notifications?')) {
        this.clearAll();
      }
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const listElement = document.getElementById('notification-list');
        listElement.innerHTML = this.renderNotificationItems(filter);
        this.attachNotificationListeners();
      });
    });

    // Attach click listeners to notification items
    this.attachNotificationListeners();

    // Start live updates
    this.startLiveUpdate();

    // Initial check for updates
    this.checkForUpdates();

    // Stop live updates when leaving the page
    window.addEventListener('hashchange', () => {
      this.stopLiveUpdate();
    }, { once: true });
  }

  async setupPushNotification() {
    const pushToggle = document.getElementById('push-toggle');
    const testNotificationBtn = document.getElementById('test-notification');
    const pushStatus = document.getElementById('push-status');

    if (!pushToggle) return;

    pushToggle.addEventListener('change', async () => {
      const isEnabled = pushToggle.checked;
      
      try {
        if (isEnabled) {
          // Request permission and subscribe
          const granted = await this.pushManager.requestPermission();
          
          if (granted) {
            await this.pushManager.registerServiceWorker();
            await this.pushManager.subscribe();
            
            this.updatePushStatus(true);
            this.showPushNotification('Push notifications enabled! 🔔', 'success');
            
            // Show test button
            location.reload();
          } else {
            pushToggle.checked = false;
            this.showPushNotification('Permission denied. Please enable notifications in browser settings.', 'error');
          }
        } else {
          // Unsubscribe
          await this.pushManager.unsubscribe();
          this.updatePushStatus(false);
          this.showPushNotification('Push notifications disabled', 'info');
          
          // Hide test button
          location.reload();
        }
      } catch (error) {
        console.error('Push notification error:', error);
        pushToggle.checked = false;
        this.showPushNotification('Failed to toggle push notifications: ' + error.message, 'error');
      }
    });

    if (testNotificationBtn) {
      testNotificationBtn.addEventListener('click', async () => {
        try {
          await this.pushManager.simulatePush({
            title: '🎉 Test Notification',
            body: 'This is a test push notification from Our Paths!',
            icon: '/images/logo.png',
            url: '/#/notification'
          });
          this.showPushNotification('Test notification sent!', 'success');
        } catch (error) {
          this.showPushNotification('Failed to send test notification', 'error');
        }
      });
    }
  }

  updatePushStatus(isEnabled) {
    const pushStatus = document.getElementById('push-status');
    if (pushStatus) {
      const indicator = pushStatus.querySelector('.status-indicator');
      const text = pushStatus.querySelector('.status-text');
      
      if (isEnabled) {
        indicator.classList.add('active');
        text.textContent = 'Push notifications enabled';
      } else {
        indicator.classList.remove('active');
        text.textContent = 'Push notifications disabled';
      }
    }
  }

  showPushNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `push-toast ${type}`;
    notification.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Helper function to log activities (can be called from other pages)
export function logActivity(type, title, message) {
  const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
  activityLog.unshift({
    type,
    title,
    message,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 activities
  if (activityLog.length > 50) {
    activityLog.length = 50;
  }
  
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

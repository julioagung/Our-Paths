# Push Notification Architecture

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ Notification Page│         │   Add Story Page │          │
│  │                  │         │                  │          │
│  │ - Toggle Switch  │         │ - Story Form     │          │
│  │ - Status Display │         │ - Photo Upload   │          │
│  │ - Test Button    │         │ - Submit Handler │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
└───────────┼────────────────────────────┼─────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PushNotificationManager (Singleton)          │   │
│  │                                                       │   │
│  │  - registerServiceWorker()                           │   │
│  │  - requestPermission()                               │   │
│  │  - subscribe()                                       │   │
│  │  - unsubscribe()                                     │   │
│  │  - isSubscribed()                                    │   │
│  │  - simulatePush()                                    │   │
│  │  - showTestNotification()                            │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser APIs                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Service      │  │ Push Manager │  │ Notification │      │
│  │ Worker API   │  │ API          │  │ API          │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
└─────────┼─────────────────┼──────────────────┼───────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Worker                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Event Listeners:                                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │ install    → Cache static assets                   │     │
│  │ activate   → Clean old caches                      │     │
│  │ fetch      → Serve from cache / network            │     │
│  │ push       → Show notification                     │     │
│  │ notificationclick → Navigate to page               │     │
│  │ message    → Handle client messages                │     │
│  └────────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Enable Push Notification Flow

```
User Action (Toggle ON)
    │
    ├─→ NotificationPage.setupPushNotification()
    │
    ├─→ PushNotificationManager.requestPermission()
    │   └─→ Notification.requestPermission()
    │       └─→ Browser shows permission dialog
    │
    ├─→ PushNotificationManager.registerServiceWorker()
    │   └─→ navigator.serviceWorker.register('/sw.js')
    │       └─→ Service Worker installed & activated
    │
    ├─→ PushNotificationManager.subscribe()
    │   └─→ registration.pushManager.subscribe()
    │       └─→ Subscription created
    │
    └─→ Update UI (status indicator, enable test button)
```

### 2. Add Story → Push Notification Flow

```
User submits story
    │
    ├─→ AddPage.handleSubmit()
    │   └─→ API.addStory()
    │       └─→ POST /stories
    │
    ├─→ Story added successfully
    │
    ├─→ AddPage.triggerPushNotification()
    │   └─→ PushNotificationManager.simulatePush()
    │       └─→ navigator.serviceWorker.controller.postMessage()
    │
    ├─→ Service Worker receives message
    │   └─→ sw.js: 'message' event
    │       └─→ self.registration.showNotification()
    │
    └─→ Browser shows notification
        └─→ User sees notification with story data
```

### 3. Notification Click Flow

```
User clicks notification
    │
    ├─→ Service Worker: 'notificationclick' event
    │
    ├─→ event.notification.close()
    │
    ├─→ Get URL from notification.data
    │
    ├─→ clients.matchAll()
    │   │
    │   ├─→ If window exists:
    │   │   └─→ client.focus() + client.navigate(url)
    │   │
    │   └─→ If no window:
    │       └─→ clients.openWindow(url)
    │
    └─→ User navigated to story page
```

## 🗂️ File Structure & Responsibilities

### Frontend Files

```
src/
├── public/
│   ├── sw.js                          # Service Worker
│   │   ├── Cache management
│   │   ├── Push event handler
│   │   ├── Notification click handler
│   │   └── Message handler
│   │
│   └── test-push.html                 # Standalone test page
│
├── scripts/
│   ├── index.js                       # App entry point
│   │   └── Register service worker on load
│   │
│   ├── utils/
│   │   └── push-notification.js       # Push Manager (Singleton)
│   │       ├── Service worker registration
│   │       ├── Permission handling
│   │       ├── Subscription management
│   │       └── Notification utilities
│   │
│   └── pages/
│       ├── notification/
│       │   └── notification-page.js   # Notification UI
│       │       ├── Push toggle
│       │       ├── Status display
│       │       ├── Test button
│       │       └── Notification list
│       │
│       └── add/
│           └── add-page.js            # Add Story
│               ├── Story form
│               ├── Submit handler
│               └── Push trigger
│
└── styles/
    └── styles.css                     # Styling
        ├── Push notification card
        ├── Toggle switch
        └── Toast notifications
```

## 🔧 Component Details

### 1. PushNotificationManager

**Purpose**: Centralized push notification management

**Key Methods**:
```javascript
class PushNotificationManager {
  // Check browser support
  isSupported(): boolean
  
  // Check permission status
  isGranted(): boolean
  
  // Request notification permission
  requestPermission(): Promise<boolean>
  
  // Register service worker
  registerServiceWorker(): Promise<ServiceWorkerRegistration>
  
  // Subscribe to push notifications
  subscribe(): Promise<PushSubscription>
  
  // Unsubscribe from push
  unsubscribe(): Promise<boolean>
  
  // Check subscription status
  isSubscribed(): Promise<boolean>
  
  // Show test notification
  showTestNotification(title, body, data): Promise<void>
  
  // Simulate push (for testing)
  simulatePush(data): Promise<void>
}
```

**State Management**:
- `registration`: ServiceWorkerRegistration
- `subscription`: PushSubscription
- Stored in localStorage: `pushSubscription`

### 2. Service Worker (sw.js)

**Purpose**: Background script for push notifications

**Event Handlers**:

```javascript
// Install - cache static assets
self.addEventListener('install', (event) => {
  // Cache app shell
  // Skip waiting
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  // Delete old caches
  // Claim clients
});

// Fetch - serve from cache
self.addEventListener('fetch', (event) => {
  // Cache-first strategy
});

// Push - show notification
self.addEventListener('push', (event) => {
  // Parse push data
  // Show notification with data
});

// Notification click - navigate
self.addEventListener('notificationclick', (event) => {
  // Close notification
  // Focus or open window
  // Navigate to URL
});

// Message - handle client messages
self.addEventListener('message', (event) => {
  // Handle SKIP_WAITING
  // Handle SHOW_NOTIFICATION
});
```

### 3. NotificationPage

**Purpose**: UI for managing push notifications

**Features**:
- Push notification toggle
- Status indicator
- Test notification button
- Notification list
- Filter & search

**State**:
- `notifications`: Array of notification objects
- `pushManager`: Reference to PushNotificationManager
- `updateInterval`: Timer for live updates

### 4. AddPage

**Purpose**: Story creation with push trigger

**Flow**:
1. User fills form (photo, description, location)
2. Submit story to API
3. On success, trigger push notification
4. Show success modal
5. Navigate to home

**Push Integration**:
```javascript
async handleSubmit() {
  // Submit story
  const result = await addStory(data);
  
  // Trigger push
  if (result.success) {
    await this.triggerPushNotification(description, photo);
  }
}
```

## 📊 Data Models

### Notification Object
```javascript
{
  id: number,              // Unique ID
  type: string,            // 'story', 'welcome', 'login', etc.
  title: string,           // Notification title
  message: string,         // Notification body
  timestamp: string,       // ISO date string
  read: boolean            // Read status
}
```

### Push Notification Data
```javascript
{
  title: string,           // Notification title
  body: string,            // Notification body
  icon: string,            // Icon URL
  badge: string,           // Badge URL
  image: string,           // Image URL (optional)
  tag: string,             // Notification tag
  data: {                  // Custom data
    url: string,           // Target URL
    storyId: string,       // Story ID (optional)
    ...                    // Other custom data
  },
  actions: [               // Action buttons
    {
      action: string,      // Action ID
      title: string,       // Button text
      icon: string         // Button icon
    }
  ],
  vibrate: number[],       // Vibration pattern
  requireInteraction: boolean
}
```

### Push Subscription
```javascript
{
  endpoint: string,        // Push service endpoint
  keys: {
    p256dh: string,        // Public key
    auth: string           // Auth secret
  }
}
```

## 🔐 Security Considerations

### 1. HTTPS Requirement
- Push notifications require HTTPS
- Exception: localhost for development

### 2. User Permission
- Explicit user consent required
- Permission can be revoked anytime
- Respect user's choice

### 3. VAPID Keys
- Use VAPID for authentication
- Keep private key secure on server
- Public key in client code is safe

### 4. Data Privacy
- Don't send sensitive data in push payload
- Use notification data for routing only
- Fetch sensitive data after click

## 🚀 Performance Optimization

### 1. Service Worker Caching
```javascript
// Cache static assets
const CACHE_NAME = 'our-paths-v1';
const urlsToCache = [
  '/',
  '/styles/styles.css',
  '/scripts/index.js',
  '/images/logo.png'
];
```

### 2. Lazy Loading
- Service worker registered on window.load
- Push manager initialized on demand
- Subscription checked only when needed

### 3. Efficient Updates
- Use cache-first strategy for static assets
- Network-first for API calls
- Background sync for offline support

## 🧪 Testing Strategy

### Unit Tests
- PushNotificationManager methods
- Notification data parsing
- Permission handling

### Integration Tests
- Service worker registration
- Push subscription flow
- Notification display
- Click navigation

### E2E Tests
- Complete user flow
- Enable → Add Story → Receive → Click
- Cross-browser testing

## 📈 Monitoring & Analytics

### Key Metrics
- Permission grant rate
- Subscription rate
- Notification delivery rate
- Click-through rate
- Unsubscribe rate

### Error Tracking
- Service worker registration failures
- Permission denials
- Subscription errors
- Notification display failures

## 🔄 Future Enhancements

### Planned Features
1. Server-side push with VAPID
2. Notification preferences (types, frequency)
3. Rich notifications (images, actions)
4. Notification history sync
5. Push notification analytics
6. A/B testing for notification content
7. Scheduled notifications
8. Notification grouping
9. Silent push for background sync
10. Web Push Protocol integration

### Scalability
- Move to server-side push
- Implement notification queue
- Add rate limiting
- Implement retry logic
- Add monitoring & alerting

## 📚 References

- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [VAPID Protocol](https://tools.ietf.org/html/rfc8292)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)

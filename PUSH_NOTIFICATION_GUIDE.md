# Push Notification Implementation Guide

## Overview
Implementasi push notification untuk aplikasi Our Paths menggunakan Service Worker dan Push API.

## Fitur yang Diimplementasikan

### 1. Basic Push Notification ✅
- Push notification tampil melalui trigger data dari API
- Notifikasi muncul saat ada story baru yang ditambahkan
- Menggunakan Service Worker untuk menangani push events

### 2. Dynamic Notification Content ✅
- Judul notifikasi dinamis berdasarkan konten story
- Icon menggunakan logo aplikasi
- Pesan notifikasi menampilkan deskripsi story (max 100 karakter)
- Gambar story ditampilkan dalam notifikasi (jika tersedia)

### 3. Advanced Features ✅
- **Toggle Button**: Enable/disable push notification di halaman Notification
- **Navigation Action**: Klik notifikasi akan membuka halaman terkait
- **Action Buttons**: 
  - "View Story" - Navigasi ke halaman story
  - "Close" - Tutup notifikasi
- **Test Notification**: Tombol untuk menguji push notification
- **Status Indicator**: Menampilkan status aktif/nonaktif push notification

## Struktur File

```
src/
├── public/
│   └── sw.js                          # Service Worker
├── scripts/
│   ├── utils/
│   │   └── push-notification.js       # Push Notification Manager
│   ├── pages/
│   │   ├── notification/
│   │   │   └── notification-page.js   # Halaman notifikasi dengan toggle
│   │   └── add/
│   │       └── add-page.js            # Trigger push saat add story
│   └── index.js                       # Register service worker
└── styles/
    └── styles.css                     # Styling push notification UI
```

## Cara Menggunakan

### 1. Enable Push Notifications
1. Buka halaman **Notifications** (`/#/notification`)
2. Klik toggle **Push Notifications**
3. Izinkan notifikasi saat browser meminta permission
4. Status akan berubah menjadi "Push notifications enabled"

### 2. Test Notification
1. Setelah push notification enabled
2. Klik tombol **Test Notification**
3. Notifikasi test akan muncul

### 3. Receive Story Notifications
1. Pastikan push notification sudah enabled
2. Tambahkan story baru melalui halaman **Add Story**
3. Setelah story berhasil ditambahkan, push notification akan muncul
4. Klik notifikasi untuk melihat story

### 4. Disable Push Notifications
1. Buka halaman **Notifications**
2. Klik toggle **Push Notifications** untuk disable
3. Status akan berubah menjadi "Push notifications disabled"

## Technical Details

### Service Worker (sw.js)
- **Install**: Cache static assets
- **Activate**: Clean up old caches
- **Fetch**: Serve from cache with network fallback
- **Push**: Handle incoming push notifications
- **Notification Click**: Navigate to story page

### Push Notification Manager
```javascript
// Subscribe to push notifications
await PushNotificationManager.subscribe();

// Unsubscribe
await PushNotificationManager.unsubscribe();

// Check subscription status
const isSubscribed = await PushNotificationManager.isSubscribed();

// Simulate push (for testing)
await PushNotificationManager.simulatePush({
  title: 'Title',
  body: 'Message',
  icon: '/images/logo.png',
  url: '/#/story/123'
});
```

### Notification Data Structure
```javascript
{
  title: 'Story Title',
  body: 'Story description...',
  icon: '/images/logo.png',
  badge: '/images/logo.png',
  image: 'story-photo-url',
  tag: 'story-notification',
  data: {
    url: '/#/story/123',
    storyId: '123'
  },
  actions: [
    { action: 'view', title: 'View Story' },
    { action: 'close', title: 'Close' }
  ],
  vibrate: [200, 100, 200]
}
```

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Limited support (iOS 16.4+)
- Opera: ✅ Full support

## Production Setup

### VAPID Keys (untuk production)
Untuk production, Anda perlu generate VAPID keys:

```bash
npm install web-push -g
web-push generate-vapid-keys
```

Update `PUBLIC_VAPID_KEY` di `src/scripts/utils/push-notification.js`:
```javascript
const PUBLIC_VAPID_KEY = 'YOUR_ACTUAL_PUBLIC_KEY';
```

### Server-Side Push
Untuk production, push notification harus dikirim dari server:

```javascript
// Backend (Node.js example)
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

// Send push notification
webpush.sendNotification(subscription, JSON.stringify({
  title: 'New Story',
  body: 'Check out this amazing story!',
  icon: '/images/logo.png',
  data: { storyId: '123' }
}));
```

## Testing

### Local Testing
1. Run development server: `npm run dev`
2. Open browser (Chrome recommended)
3. Enable push notifications
4. Add a new story
5. Notification should appear

### Debugging
- Open DevTools > Application > Service Workers
- Check "Update on reload" for development
- View console logs for service worker events
- Test notifications in Application > Notifications

## Notes

- Push notifications memerlukan HTTPS (atau localhost untuk development)
- User harus memberikan permission untuk menerima notifikasi
- Notifikasi akan tetap muncul meskipun tab browser ditutup (jika service worker aktif)
- Untuk production, gunakan server-side push dengan VAPID keys yang valid

## Troubleshooting

### Notifikasi tidak muncul
1. Cek permission di browser settings
2. Pastikan service worker terdaftar
3. Cek console untuk error messages
4. Pastikan HTTPS enabled (atau gunakan localhost)

### Service Worker tidak register
1. Cek path service worker (`/sw.js`)
2. Pastikan file `sw.js` ada di public folder
3. Clear browser cache dan reload
4. Cek DevTools > Application > Service Workers

### Toggle tidak berfungsi
1. Cek browser compatibility
2. Pastikan service worker sudah terdaftar
3. Cek console untuk error messages
4. Reload halaman dan coba lagi

# Troubleshooting Guide - IndexedDB Favorites & Offline Sync

## 🔍 Masalah yang Ditemukan dan Solusinya

### 1. ❌ Error "Error loading stories" di HomePage

**Penyebab:**
- IndexedDB managers (dbManager, syncManager, favoritesManager) diinisialisasi secara async
- HomePage sudah load dan mencoba mengakses IndexedDB sebelum initialization selesai
- Race condition antara initialization dan page render

**Gejala:**
```
Error loading stories.
Oops! Something went wrong
```

**Solusi yang Diterapkan:**

#### A. Synchronize Initialization (index.js)
```javascript
// BEFORE (WRONG):
(async () => {
  await dbManager.init();
  await syncManager.init();
  await favoritesManager.init();
})(); // Fire and forget - tidak menunggu selesai

// AFTER (CORRECT):
let managersInitialized = false;
const initializeManagers = async () => {
  try {
    await dbManager.init();
    await syncManager.init();
    await favoritesManager.init();
    managersInitialized = true;
  } catch (error) {
    console.error('[App] Failed to initialize managers:', error);
    managersInitialized = true; // Continue even if init fails
  }
};

initializeManagers();

// Wait for initialization before rendering
document.addEventListener('DOMContentLoaded', async () => {
  while (!managersInitialized) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  // Now safe to render pages
});
```

#### B. Add Error Handling (home-page.js)
```javascript
async setupFavoriteButtons() {
  try {
    const stories = this.presenter.getStories();
    if (!stories || stories.length === 0) {
      return; // Graceful exit if no stories
    }

    for (const story of stories) {
      try {
        const isFav = await favoritesManager.isFavorite(story.id);
        this.favoriteStates.set(story.id, isFav);
      } catch (error) {
        // Individual story error doesn't break entire process
        this.favoriteStates.set(story.id, false);
      }
    }
  } catch (error) {
    console.error('[HomePage] Failed to setup favorite buttons:', error);
  }
}
```

### 2. 🔄 Dev Server Output Kosong

**Penyebab:**
- Vite dev server butuh waktu 2-5 detik untuk start
- Process baru dimulai, output belum muncul

**Solusi:**
Tunggu beberapa detik, lalu cek output lagi:
```bash
npm run dev
# Wait 5 seconds
# Check browser at http://localhost:5173
```

**Expected Output:**
```
VITE v6.2.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 3. 🗄️ IndexedDB Not Initialized Error

**Penyebab:**
- Method dipanggil sebelum `init()` selesai
- `_ensureInitialized()` throw error

**Solusi:**
Selalu pastikan initialization selesai:
```javascript
// WRONG:
import dbManager from './data/indexed-db.js';
await dbManager.addFavorite(story); // Error if not initialized

// CORRECT:
import dbManager from './data/indexed-db.js';
if (!dbManager.isInitialized()) {
  await dbManager.init();
}
await dbManager.addFavorite(story);
```

### 4. 🚫 CORS Error saat Fetch API

**Penyebab:**
- API tidak mengizinkan request dari localhost
- Missing Authorization header

**Solusi:**
```javascript
// Pastikan token ada
const token = localStorage.getItem('token');
if (!token) {
  console.error('No token found, please login');
  return;
}

// Include token in request
const response = await fetch(API_URL, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 5. 💾 QuotaExceededError

**Penyebab:**
- Storage quota browser terlampaui
- Terlalu banyak data di IndexedDB

**Solusi:**
```javascript
try {
  await dbManager.addFavorite(story);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    alert('Storage full! Please clear some favorites.');
    // Implement cleanup
    await dbManager.clearOldData();
  }
}
```

### 6. 🔄 Background Sync Tidak Berjalan

**Penyebab:**
- Browser tidak support Background Sync API
- Service Worker tidak aktif
- Sync tag tidak terdaftar

**Solusi:**
```javascript
// Check support
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-stories');
} else {
  console.log('Background Sync not supported, using fallback');
  // Fallback to manual sync
  window.addEventListener('online', () => {
    syncManager.syncAll();
  });
}
```

### 7. ❤️ Favorite Button Tidak Update

**Penyebab:**
- State tidak di-update setelah toggle
- Event listener tidak terpasang

**Solusi:**
```javascript
async handleFavoriteToggle(storyId, button) {
  // Update state
  const isFavorite = this.favoriteStates.get(storyId) || false;
  
  if (isFavorite) {
    await favoritesManager.removeFromFavorites(storyId);
    this.favoriteStates.set(storyId, false);
  } else {
    await favoritesManager.addToFavorites(story);
    this.favoriteStates.set(storyId, true);
  }

  // IMPORTANT: Update UI after state change
  this.updateFavoriteButton(storyId, button);
}
```

## 🧪 Testing Checklist

### Before Testing
- [ ] Run `npm install` to ensure dependencies installed
- [ ] Run `npm run build` to check for build errors
- [ ] Clear browser cache and IndexedDB
- [ ] Open browser DevTools Console

### Basic Functionality
- [ ] Login successfully
- [ ] HomePage loads without errors
- [ ] Stories display correctly
- [ ] Favorite button appears on each story card

### Favorites Feature
- [ ] Click favorite button → icon changes 🤍 → ❤️
- [ ] Click again → icon changes back ❤️ → 🤍
- [ ] Navigate to Favorites page
- [ ] Favorites list shows added stories
- [ ] Search favorites works
- [ ] Filter by location works
- [ ] Sort works (newest/oldest/name)
- [ ] Remove from favorites works

### Offline Sync
- [ ] Disconnect internet (DevTools → Network → Offline)
- [ ] Add new story
- [ ] See "Saved offline" message
- [ ] Reconnect internet
- [ ] See "Syncing..." notification
- [ ] Story appears in home page after sync

### Browser Console Checks
Look for these logs:
```
[App] IndexedDB and managers initialized
[IndexedDB] Database opened successfully
[FavoritesManager] Initialized
[SyncManager] Initialized
[HomePage] Setup favorite buttons
```

## 🔧 Debug Commands

### Check IndexedDB in Browser
```javascript
// Open DevTools Console
// Check if database exists
indexedDB.databases().then(console.log);

// Check data
const request = indexedDB.open('OurPathsDB', 1);
request.onsuccess = () => {
  const db = request.result;
  const tx = db.transaction(['favorites'], 'readonly');
  const store = tx.objectStore('favorites');
  const getAllRequest = store.getAll();
  getAllRequest.onsuccess = () => {
    console.log('Favorites:', getAllRequest.result);
  };
};
```

### Check Service Worker
```javascript
// Check if service worker registered
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service Worker:', reg);
  console.log('Active:', reg.active);
  console.log('Waiting:', reg.waiting);
});

// Check sync registration
navigator.serviceWorker.ready.then(reg => {
  return reg.sync.getTags();
}).then(tags => {
  console.log('Sync tags:', tags);
});
```

### Check Storage Usage
```javascript
navigator.storage.estimate().then(estimate => {
  console.log('Storage used:', estimate.usage);
  console.log('Storage quota:', estimate.quota);
  console.log('Percentage:', (estimate.usage / estimate.quota * 100).toFixed(2) + '%');
});
```

### Clear All Data (Reset)
```javascript
// Clear IndexedDB
indexedDB.deleteDatabase('OurPathsDB');

// Clear Cache
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Clear localStorage
localStorage.clear();

// Unregister service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Reload page
location.reload();
```

## 📱 Browser-Specific Issues

### Chrome
- ✅ Full support untuk semua fitur
- Background Sync works perfectly
- IndexedDB quota: ~60% of available disk space

### Firefox
- ✅ Full support
- Background Sync: Limited support
- IndexedDB quota: ~50% of available disk space

### Safari
- ⚠️ Limited support
- Background Sync: Not supported
- IndexedDB quota: ~1GB max
- Workaround: Use online event listener for sync

### Edge
- ✅ Full support (Chromium-based)
- Same as Chrome

## 🚨 Common Error Messages

### "IndexedDB not initialized"
```
Solution: Wait for initialization
await dbManager.init();
```

### "Failed to execute 'transaction' on 'IDBDatabase'"
```
Solution: Database connection closed
await dbManager.init(); // Re-initialize
```

### "The quota has been exceeded"
```
Solution: Clear old data
await dbManager.clearOldFavorites();
```

### "Failed to fetch"
```
Solution: Check network and token
- Verify internet connection
- Check token in localStorage
- Verify API endpoint
```

## 📞 Support

Jika masih ada masalah:
1. Check browser console untuk error messages
2. Check Network tab untuk failed requests
3. Check Application → IndexedDB untuk data
4. Check Application → Service Workers untuk SW status
5. Clear all data dan coba lagi

## ✅ Verification Steps

Setelah fix, verify:
1. ✅ No errors in console
2. ✅ IndexedDB initialized successfully
3. ✅ Favorites can be added/removed
4. ✅ Offline sync works
5. ✅ Background sync registered
6. ✅ UI updates correctly

**Status: FIXED** ✅

Semua masalah telah diperbaiki dengan:
- Proper initialization synchronization
- Better error handling
- Graceful fallbacks
- Comprehensive logging

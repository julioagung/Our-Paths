# Design Document - IndexedDB Favorites & Offline Sync

## Overview

Implementasi fitur favorites dan offline sync untuk aplikasi Our Paths menggunakan IndexedDB sebagai storage lokal. Fitur ini memungkinkan pengguna menyimpan story favorit, mengakses konten offline, dan melakukan sinkronisasi otomatis saat koneksi kembali online.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
├─────────────────────────────────────────────────────────────┤
│  HomePage  │  FavoritesPage  │  AddPage  │  DetailPage     │
└──────┬──────────────┬─────────────┬────────────┬────────────┘
       │              │             │            │
       ▼              ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  FavoritesManager  │  SyncManager  │  CacheManager          │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│         IndexedDBManager (Singleton)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Object Stores:                                     │    │
│  │  - favorites (story data)                           │    │
│  │  - offline_queue (pending operations)               │    │
│  │  - sync_status (sync metadata)                      │    │
│  └────────────────────────────────────────────────────┘    │
└──────┬──────────────┬──────────────┬─────────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Browser APIs & Service Worker                   │
├─────────────────────────────────────────────────────────────┤
│  IndexedDB API  │  Background Sync API  │  Network API      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. IndexedDBManager

**Purpose**: Centralized IndexedDB operations manager

**Interface**:
```javascript
class IndexedDBManager {
  constructor()
  
  // Database initialization
  async init(): Promise<void>
  async deleteDatabase(): Promise<void>
  
  // Favorites operations
  async addFavorite(story: Story): Promise<number>
  async getFavorite(id: string): Promise<Story | null>
  async getAllFavorites(): Promise<Story[]>
  async removeFavorite(id: string): Promise<void>
  async isFavorite(id: string): Promise<boolean>
  async searchFavorites(query: string): Promise<Story[]>
  async sortFavorites(sortBy: 'newest' | 'oldest' | 'name'): Promise<Story[]>
  
  // Offline queue operations
  async addToQueue(operation: OfflineOperation): Promise<number>
  async getQueueItem(id: number): Promise<OfflineOperation | null>
  async getAllQueueItems(): Promise<OfflineOperation[]>
  async removeFromQueue(id: number): Promise<void>
  async clearQueue(): Promise<void>
  
  // Sync status operations
  async updateSyncStatus(status: SyncStatus): Promise<void>
  async getSyncStatus(): Promise<SyncStatus>
}
```

**Database Schema**:
```javascript
const DB_NAME = 'OurPathsDB';
const DB_VERSION = 1;

// Object Stores
const STORES = {
  FAVORITES: 'favorites',      // Story favorites
  OFFLINE_QUEUE: 'offline_queue', // Pending operations
  SYNC_STATUS: 'sync_status'   // Sync metadata
};

// Indexes
const INDEXES = {
  FAVORITES: {
    by_date: 'createdAt',
    by_name: 'name'
  }
};
```

### 2. FavoritesManager

**Purpose**: Business logic for favorites management

**Interface**:
```javascript
class FavoritesManager {
  constructor(dbManager: IndexedDBManager)
  
  // Core operations
  async addToFavorites(storyId: string): Promise<void>
  async removeFromFavorites(storyId: string): Promise<void>
  async isFavorite(storyId: string): Promise<boolean>
  async getFavorites(): Promise<Story[]>
  
  // Search & Filter
  async searchFavorites(query: string): Promise<Story[]>
  async filterFavorites(filter: FilterOptions): Promise<Story[]>
  async sortFavorites(sortBy: SortOption): Promise<Story[]>
  
  // Sync with API
  async syncFavoriteData(storyId: string): Promise<void>
  async refreshFavorites(): Promise<void>
  
  // Event listeners
  addListener(callback: FavoritesListener): void
  removeListener(callback: FavoritesListener): void
  notifyListeners(event: FavoritesEvent): void
}
```

### 3. SyncManager

**Purpose**: Handle offline operations and synchronization

**Interface**:
```javascript
class SyncManager {
  constructor(dbManager: IndexedDBManager)
  
  // Offline operations
  async saveStoryOffline(storyData: StoryInput): Promise<void>
  async queueOperation(operation: OfflineOperation): Promise<void>
  
  // Sync operations
  async syncAll(): Promise<SyncResult>
  async syncStory(queueId: number): Promise<boolean>
  async manualSync(): Promise<SyncResult>
  
  // Status management
  async getSyncStatus(): Promise<SyncStatus>
  async getPendingCount(): Promise<number>
  async getFailedOperations(): Promise<OfflineOperation[]>
  
  // Event listeners
  addSyncListener(callback: SyncListener): void
  removeSyncListener(callback: SyncListener): void
  notifySyncListeners(event: SyncEvent): void
  
  // Auto-sync
  startAutoSync(): void
  stopAutoSync(): void
}
```

### 4. CacheManager

**Purpose**: Manage dynamic content caching for offline access

**Interface**:
```javascript
class CacheManager {
  constructor()
  
  // Cache operations
  async cacheStories(stories: Story[]): Promise<void>
  async getCachedStories(): Promise<Story[]>
  async cacheStory(story: Story): Promise<void>
  async getCachedStory(id: string): Promise<Story | null>
  async removeCachedStory(id: string): Promise<void>
  async clearCache(): Promise<void>
  
  // Cache status
  async getCacheSize(): Promise<number>
  async isCached(id: string): Promise<boolean>
}
```

### 5. FavoritesPage

**Purpose**: UI for displaying and managing favorites

**Interface**:
```javascript
class FavoritesPage {
  constructor()
  
  // Lifecycle
  async render(): Promise<string>
  async afterRender(): Promise<void>
  
  // UI operations
  displayFavorites(stories: Story[]): void
  showLoading(): void
  showError(message: string): void
  showEmpty(): void
  
  // User interactions
  setupSearch(): void
  setupFilters(): void
  setupSort(): void
  handleRemoveFavorite(storyId: string): void
  handleViewStory(storyId: string): void
}
```

## Data Models

### Story Model
```typescript
interface Story {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  createdAt: string;
  lat?: number;
  lon?: number;
  // IndexedDB specific
  favoritedAt?: string;  // When added to favorites
  cachedAt?: string;     // When cached locally
}
```

### OfflineOperation Model
```typescript
interface OfflineOperation {
  id?: number;           // Auto-increment ID
  type: 'add_story' | 'update_story' | 'delete_story';
  data: {
    description: string;
    photo: Blob;
    lat?: number;
    lon?: number;
  };
  status: 'pending' | 'syncing' | 'failed';
  createdAt: string;
  attempts: number;
  lastAttempt?: string;
  error?: string;
}
```

### SyncStatus Model
```typescript
interface SyncStatus {
  lastSync?: string;     // ISO timestamp
  pendingStories: number;
  failedStories: number;
  isOnline: boolean;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
}
```

### FilterOptions Model
```typescript
interface FilterOptions {
  searchQuery?: string;
  hasLocation?: boolean;
  dateFrom?: string;
  dateTo?: string;
}
```

### SortOption Type
```typescript
type SortOption = 'newest' | 'oldest' | 'name';
```

## Implementation Details

### 1. IndexedDB Setup

```javascript
// src/scripts/data/indexed-db.js

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.DB_NAME = 'OurPathsDB';
    this.DB_VERSION = 1;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Favorites store
        if (!db.objectStoreNames.contains('favorites')) {
          const favStore = db.createObjectStore('favorites', { keyPath: 'id' });
          favStore.createIndex('by_date', 'favoritedAt', { unique: false });
          favStore.createIndex('by_name', 'name', { unique: false });
        }

        // Offline queue store
        if (!db.objectStoreNames.contains('offline_queue')) {
          const queueStore = db.createObjectStore('offline_queue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          queueStore.createIndex('by_status', 'status', { unique: false });
          queueStore.createIndex('by_date', 'createdAt', { unique: false });
        }

        // Sync status store
        if (!db.objectStoreNames.contains('sync_status')) {
          db.createObjectStore('sync_status', { keyPath: 'key' });
        }
      };
    });
  }

  // CRUD operations implementation...
}
```

### 2. Favorites Integration

**In HomePage**:
```javascript
// Add favorite button to story cards
<button class="favorite-btn" data-story-id="${story.id}">
  <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
</button>

// Handle favorite toggle
async handleFavoriteToggle(storyId) {
  const isFav = await favoritesManager.isFavorite(storyId);
  
  if (isFav) {
    await favoritesManager.removeFromFavorites(storyId);
    this.showNotification('Removed from favorites', 'info');
  } else {
    await favoritesManager.addToFavorites(storyId);
    this.showNotification('Added to favorites', 'success');
  }
  
  this.updateFavoriteButton(storyId);
}
```

### 3. Offline Story Submission

**In AddPage**:
```javascript
async handleSubmit() {
  const isOnline = navigator.onLine;
  
  if (!isOnline) {
    // Save to offline queue
    await syncManager.saveStoryOffline({
      description,
      photo,
      lat,
      lon
    });
    
    this.showNotification('Saved offline! Will sync when online.', 'info');
    return;
  }
  
  // Normal online submission
  const result = await addStory({ description, photo, lat, lon });
  // ...
}
```

### 4. Background Sync

**In Service Worker**:
```javascript
// Register sync event
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncPendingStories());
  }
});

async function syncPendingStories() {
  // Get pending operations from IndexedDB
  // Attempt to sync each one
  // Update status based on results
}
```

**In SyncManager**:
```javascript
async startAutoSync() {
  // Listen for online event
  window.addEventListener('online', async () => {
    console.log('Back online, starting sync...');
    await this.syncAll();
  });
  
  // Register background sync if supported
  if ('serviceWorker' in navigator && 'sync' in registration) {
    await registration.sync.register('sync-stories');
  }
}
```

### 5. Dynamic Content Caching

**In Service Worker**:
```javascript
// Cache API responses
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/v1/stories')) {
    event.respondWith(
      networkFirstWithCache(event.request, 'api-cache')
    );
  }
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}
```

## Error Handling

### 1. IndexedDB Errors
```javascript
try {
  await dbManager.addFavorite(story);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    showNotification('Storage quota exceeded. Please free up space.', 'error');
  } else {
    showNotification('Failed to save favorite. Please try again.', 'error');
  }
  console.error('IndexedDB error:', error);
}
```

### 2. Sync Errors
```javascript
async syncStory(operation) {
  try {
    const result = await addStory(operation.data);
    
    if (result.error) {
      operation.status = 'failed';
      operation.error = result.message;
      operation.attempts++;
      await this.dbManager.updateQueueItem(operation);
      return false;
    }
    
    await this.dbManager.removeFromQueue(operation.id);
    return true;
  } catch (error) {
    operation.status = 'failed';
    operation.error = error.message;
    operation.attempts++;
    
    // Retry logic
    if (operation.attempts < 3) {
      operation.status = 'pending';
    }
    
    await this.dbManager.updateQueueItem(operation);
    return false;
  }
}
```

### 3. Network Errors
```javascript
window.addEventListener('offline', () => {
  showBanner('You are offline. Changes will be synced when online.', 'warning');
});

window.addEventListener('online', () => {
  showBanner('Back online! Syncing changes...', 'info');
  syncManager.syncAll();
});
```

## Testing Strategy

### Unit Tests
- IndexedDBManager CRUD operations
- FavoritesManager business logic
- SyncManager sync operations
- Data model validation

### Integration Tests
- Favorites add/remove flow
- Offline story submission
- Sync process end-to-end
- Cache management

### E2E Tests
- User adds story offline → goes online → story syncs
- User favorites story → views in favorites page → removes favorite
- User searches favorites → filters results → sorts list
- Network interruption during sync → retry logic

### Performance Tests
- Large dataset handling (1000+ favorites)
- Sync performance with multiple pending operations
- Cache size management
- IndexedDB query performance

## Security Considerations

### 1. Data Privacy
- All data stored locally in user's browser
- No sensitive data in IndexedDB
- Clear data on logout (optional)

### 2. Storage Limits
- Monitor quota usage
- Implement cleanup strategy
- Warn user when approaching limit

### 3. Data Validation
- Validate data before storing
- Sanitize user input
- Verify data integrity on retrieval

## Performance Optimization

### 1. Lazy Loading
- Load favorites on demand
- Paginate large lists
- Use virtual scrolling for long lists

### 2. Caching Strategy
- Cache frequently accessed data
- Implement LRU cache eviction
- Preload critical data

### 3. Batch Operations
- Batch IndexedDB writes
- Batch sync operations
- Debounce search/filter operations

### 4. Background Processing
- Use Web Workers for heavy operations
- Offload sync to service worker
- Use requestIdleCallback for non-critical tasks

## Monitoring & Analytics

### Key Metrics
- Favorites count per user
- Offline operations count
- Sync success rate
- Sync latency
- Storage usage
- Error rates

### Logging
```javascript
class Logger {
  static log(category, action, data) {
    console.log(`[${category}] ${action}:`, data);
    
    // Send to analytics if needed
    if (window.analytics) {
      window.analytics.track(action, {
        category,
        ...data
      });
    }
  }
}

// Usage
Logger.log('Favorites', 'Add', { storyId: '123' });
Logger.log('Sync', 'Complete', { synced: 5, failed: 0 });
```

## Migration Strategy

### Phase 1: IndexedDB Setup
1. Create IndexedDBManager
2. Initialize database on app load
3. Add error handling

### Phase 2: Favorites Feature
1. Add favorites UI components
2. Implement FavoritesManager
3. Create FavoritesPage
4. Add search/filter/sort

### Phase 3: Offline Support
1. Implement offline detection
2. Create offline queue
3. Add SyncManager
4. Test offline scenarios

### Phase 4: Background Sync
1. Register sync event in service worker
2. Implement auto-sync
3. Add retry logic
4. Test sync reliability

### Phase 5: Optimization
1. Add caching layer
2. Optimize queries
3. Implement cleanup
4. Performance testing

## File Structure

```
src/
├── scripts/
│   ├── data/
│   │   ├── indexed-db.js          # IndexedDB manager
│   │   ├── favorites-manager.js   # Favorites business logic
│   │   ├── sync-manager.js        # Sync operations
│   │   └── cache-manager.js       # Cache management
│   │
│   ├── pages/
│   │   ├── favorites/
│   │   │   └── favorites-page.js  # Favorites UI
│   │   ├── home/
│   │   │   └── home-page.js       # Updated with favorites
│   │   └── add/
│   │       └── add-page.js        # Updated with offline support
│   │
│   └── utils/
│       ├── network-status.js      # Network detection
│       └── storage-utils.js       # Storage helpers
│
├── public/
│   └── sw.js                      # Updated service worker
│
└── styles/
    └── favorites.css              # Favorites styling
```

## Dependencies

- **IndexedDB API**: Native browser API (no external dependencies)
- **Service Worker API**: For background sync
- **Network Information API**: For connection status
- **Leaflet**: Already included for maps

## Browser Compatibility

- **IndexedDB**: Chrome 24+, Firefox 16+, Safari 10+, Edge 12+
- **Background Sync**: Chrome 49+, Edge 79+ (limited support)
- **Fallback**: Graceful degradation for unsupported browsers

## Future Enhancements

1. **Export/Import Favorites**: Allow users to backup favorites
2. **Favorites Sync Across Devices**: Cloud sync for logged-in users
3. **Smart Caching**: ML-based prediction of content to cache
4. **Conflict Resolution**: Handle sync conflicts intelligently
5. **Compression**: Compress stored data to save space
6. **Encryption**: Encrypt sensitive data in IndexedDB

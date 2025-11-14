// IndexedDB Manager for Our Paths Application
// Handles all IndexedDB operations for favorites, offline queue, and sync status

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.DB_NAME = 'OurPathsDB';
    this.DB_VERSION = 1;
    
    // Object store names
    this.STORES = {
      FAVORITES: 'favorites',
      OFFLINE_QUEUE: 'offline_queue',
      SYNC_STATUS: 'sync_status'
    };
  }

  /**
   * Initialize IndexedDB database
   * Creates object stores and indexes if they don't exist
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('[IndexedDB] Upgrading database schema...');

        // Create Favorites store
        if (!db.objectStoreNames.contains(this.STORES.FAVORITES)) {
          const favStore = db.createObjectStore(this.STORES.FAVORITES, { 
            keyPath: 'id' 
          });
          
          // Create indexes for efficient querying
          favStore.createIndex('by_date', 'favoritedAt', { unique: false });
          favStore.createIndex('by_name', 'name', { unique: false });
          
          console.log('[IndexedDB] Created favorites store with indexes');
        }

        // Create Offline Queue store
        if (!db.objectStoreNames.contains(this.STORES.OFFLINE_QUEUE)) {
          const queueStore = db.createObjectStore(this.STORES.OFFLINE_QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for filtering
          queueStore.createIndex('by_status', 'status', { unique: false });
          queueStore.createIndex('by_date', 'createdAt', { unique: false });
          
          console.log('[IndexedDB] Created offline_queue store with indexes');
        }

        // Create Sync Status store
        if (!db.objectStoreNames.contains(this.STORES.SYNC_STATUS)) {
          db.createObjectStore(this.STORES.SYNC_STATUS, { 
            keyPath: 'key' 
          });
          
          console.log('[IndexedDB] Created sync_status store');
        }
      };
    });
  }

  /**
   * Delete the entire database
   * @returns {Promise<void>}
   */
  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      const request = indexedDB.deleteDatabase(this.DB_NAME);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Database deleted successfully');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to delete database:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if database is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.db !== null;
  }

  /**
   * Ensure database is initialized before operations
   * @private
   */
  _ensureInitialized() {
    if (!this.isInitialized()) {
      throw new Error('IndexedDB not initialized. Call init() first.');
    }
  }

  // ==================== FAVORITES OPERATIONS ====================

  /**
   * Add a story to favorites
   * @param {Object} story - Story object to add
   * @returns {Promise<string>} Story ID
   */
  async addFavorite(story) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      
      // Add favoritedAt timestamp
      const favoriteStory = {
        ...story,
        favoritedAt: new Date().toISOString()
      };
      
      const request = store.put(favoriteStory);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Added to favorites:', story.id);
        resolve(story.id);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to add favorite:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single favorite by ID
   * @param {string} id - Story ID
   * @returns {Promise<Object|null>} Story object or null if not found
   */
  async getFavorite(id) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get favorite:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all favorites
   * @returns {Promise<Array>} Array of favorite stories
   */
  async getAllFavorites() {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Retrieved all favorites:', request.result.length);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get all favorites:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove a story from favorites
   * @param {string} id - Story ID
   * @returns {Promise<void>}
   */
  async removeFavorite(id) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Removed from favorites:', id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to remove favorite:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Check if a story is in favorites
   * @param {string} id - Story ID
   * @returns {Promise<boolean>}
   */
  async isFavorite(id) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.count(id);
      
      request.onsuccess = () => {
        resolve(request.result > 0);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to check favorite:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search favorites by query string
   * @param {string} query - Search query
   * @returns {Promise<Array>} Filtered favorites
   */
  async searchFavorites(query) {
    this._ensureInitialized();
    
    const allFavorites = await this.getAllFavorites();
    const lowerQuery = query.toLowerCase();
    
    return allFavorites.filter(story => 
      story.name.toLowerCase().includes(lowerQuery) ||
      story.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Sort favorites by specified criteria
   * @param {string} sortBy - Sort criteria: 'newest', 'oldest', 'name'
   * @returns {Promise<Array>} Sorted favorites
   */
  async sortFavorites(sortBy = 'newest') {
    this._ensureInitialized();
    
    const allFavorites = await this.getAllFavorites();
    
    switch (sortBy) {
      case 'newest':
        return allFavorites.sort((a, b) => 
          new Date(b.favoritedAt) - new Date(a.favoritedAt)
        );
      
      case 'oldest':
        return allFavorites.sort((a, b) => 
          new Date(a.favoritedAt) - new Date(b.favoritedAt)
        );
      
      case 'name':
        return allFavorites.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      
      default:
        return allFavorites;
    }
  }

  // ==================== OFFLINE QUEUE OPERATIONS ====================

  /**
   * Add an operation to the offline queue
   * @param {Object} operation - Operation object
   * @returns {Promise<number>} Operation ID
   */
  async addToQueue(operation) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      
      const queueItem = {
        ...operation,
        createdAt: operation.createdAt || new Date().toISOString(),
        status: operation.status || 'pending',
        attempts: operation.attempts || 0
      };
      
      const request = store.add(queueItem);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Added to offline queue:', request.result);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to add to queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single queue item by ID
   * @param {number} id - Queue item ID
   * @returns {Promise<Object|null>} Queue item or null
   */
  async getQueueItem(id) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get queue item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all items from offline queue
   * @returns {Promise<Array>} Array of queue items
   */
  async getAllQueueItems() {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Retrieved queue items:', request.result.length);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get queue items:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove an item from offline queue
   * @param {number} id - Queue item ID
   * @returns {Promise<void>}
   */
  async removeFromQueue(id) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Removed from queue:', id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to remove from queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update a queue item
   * @param {Object} operation - Updated operation object (must include id)
   * @returns {Promise<void>}
   */
  async updateQueueItem(operation) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      
      const request = store.put(operation);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Updated queue item:', operation.id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to update queue item:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all items from offline queue
   * @returns {Promise<void>}
   */
  async clearQueue() {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readwrite');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Cleared offline queue');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to clear queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queue items by status
   * @param {string} status - Status to filter by ('pending', 'syncing', 'failed')
   * @returns {Promise<Array>} Filtered queue items
   */
  async getQueueItemsByStatus(status) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.OFFLINE_QUEUE], 'readonly');
      const store = transaction.objectStore(this.STORES.OFFLINE_QUEUE);
      const index = store.index('by_status');
      const request = index.getAll(status);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get queue items by status:', request.error);
        reject(request.error);
      };
    });
  }

  // ==================== SYNC STATUS OPERATIONS ====================

  /**
   * Update sync status
   * @param {Object} status - Sync status object
   * @returns {Promise<void>}
   */
  async updateSyncStatus(status) {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.SYNC_STATUS], 'readwrite');
      const store = transaction.objectStore(this.STORES.SYNC_STATUS);
      
      const statusData = {
        key: 'main',
        ...status,
        lastUpdated: new Date().toISOString()
      };
      
      const request = store.put(statusData);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Updated sync status');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to update sync status:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get current sync status
   * @returns {Promise<Object>} Sync status object
   */
  async getSyncStatus() {
    this._ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORES.SYNC_STATUS], 'readonly');
      const store = transaction.objectStore(this.STORES.SYNC_STATUS);
      const request = store.get('main');
      
      request.onsuccess = () => {
        const defaultStatus = {
          key: 'main',
          lastSync: null,
          pendingStories: 0,
          failedStories: 0,
          isOnline: navigator.onLine,
          isSyncing: false,
          autoSyncEnabled: true
        };
        
        resolve(request.result || defaultStatus);
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to get sync status:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get count of pending operations
   * @returns {Promise<number>} Count of pending items
   */
  async getPendingCount() {
    this._ensureInitialized();
    
    const pendingItems = await this.getQueueItemsByStatus('pending');
    return pendingItems.length;
  }

  /**
   * Get count of failed operations
   * @returns {Promise<number>} Count of failed items
   */
  async getFailedCount() {
    this._ensureInitialized();
    
    const failedItems = await this.getQueueItemsByStatus('failed');
    return failedItems.length;
  }

  // ==================== STORIES CACHE OPERATIONS ====================

  /**
   * Save stories to cache
   * @param {Array} stories - Array of stories
   * @returns {Promise<void>}
   */
  async saveStories(stories) {
    this._ensureInitialized();
    
    try {
      // Use favorites store for caching (reuse existing store)
      const transaction = this.db.transaction([this.STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      
      for (const story of stories) {
        await new Promise((resolve, reject) => {
          const request = store.put({
            ...story,
            cachedAt: new Date().toISOString()
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      console.log('[IndexedDB] Cached', stories.length, 'stories');
    } catch (error) {
      console.error('[IndexedDB] Failed to cache stories:', error);
    }
  }

  /**
   * Get all cached stories
   * @returns {Promise<Array>}
   */
  async getAllStories() {
    // Alias for getAllFavorites for backward compatibility
    return await this.getAllFavorites();
  }

  /**
   * Clear all cached stories
   * @returns {Promise<void>}
   */
  async clearAllStories() {
    // Don't clear - we want to keep favorites
    // This is just for compatibility
    console.log('[IndexedDB] clearAllStories called - keeping favorites');
  }
}

// Export singleton instance
export default new IndexedDBManager();

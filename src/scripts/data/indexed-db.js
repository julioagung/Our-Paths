// IndexedDB Manager for Story App
// Handles offline storage and synchronization

const DB_NAME = 'StoryAppDB';
const DB_VERSION = 1;
const STORES = {
  STORIES: 'stories',
  PENDING_STORIES: 'pendingStories',
  SYNC_QUEUE: 'syncQueue'
};

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Stories store - for caching API data
        if (!db.objectStoreNames.contains(STORES.STORIES)) {
          const storiesStore = db.createObjectStore(STORES.STORIES, { keyPath: 'id' });
          storiesStore.createIndex('createdAt', 'createdAt', { unique: false });
          storiesStore.createIndex('name', 'name', { unique: false });
        }

        // Pending stories store - for offline created stories
        if (!db.objectStoreNames.contains(STORES.PENDING_STORIES)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_STORIES, { 
            keyPath: 'tempId', 
            autoIncrement: true 
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sync queue store - for tracking sync operations
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // === STORIES CRUD OPERATIONS ===

  // Create/Update story in IndexedDB
  async saveStory(story) {
    const transaction = this.db.transaction([STORES.STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.put(story);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Save multiple stories (bulk operation)
  async saveStories(stories) {
    const transaction = this.db.transaction([STORES.STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.STORIES);
    
    const promises = stories.map(story => {
      return new Promise((resolve, reject) => {
        const request = store.put(story);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });

    return Promise.all(promises);
  }

  // Read all stories from IndexedDB
  async getAllStories() {
    const transaction = this.db.transaction([STORES.STORIES], 'readonly');
    const store = transaction.objectStore(STORES.STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Read single story by ID
  async getStory(id) {
    const transaction = this.db.transaction([STORES.STORIES], 'readonly');
    const store = transaction.objectStore(STORES.STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete story from IndexedDB
  async deleteStory(id) {
    const transaction = this.db.transaction([STORES.STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all stories
  async clearAllStories() {
    const transaction = this.db.transaction([STORES.STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // === PENDING STORIES (OFFLINE) ===

  // Save story created while offline
  async savePendingStory(storyData) {
    const transaction = this.db.transaction([STORES.PENDING_STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_STORIES);
    
    const pendingStory = {
      ...storyData,
      timestamp: Date.now(),
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const request = store.add(pendingStory);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending stories
  async getPendingStories() {
    const transaction = this.db.transaction([STORES.PENDING_STORIES], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete pending story after successful sync
  async deletePendingStory(tempId) {
    const transaction = this.db.transaction([STORES.PENDING_STORIES], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_STORIES);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(tempId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // === SYNC QUEUE OPERATIONS ===

  // Add sync operation to queue
  async addToSyncQueue(operation) {
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    const syncItem = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.add(syncItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending sync operations
  async getPendingSyncOperations() {
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update sync operation status
  async updateSyncStatus(id, status, error = null) {
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = status;
          item.lastAttempt = Date.now();
          if (error) item.error = error;
          if (status === 'failed') item.retryCount = (item.retryCount || 0) + 1;
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Sync item not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete completed sync operation
  async deleteSyncOperation(id) {
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // === SEARCH & FILTER OPERATIONS ===

  // Search stories by name or description
  async searchStories(searchTerm) {
    const allStories = await this.getAllStories();
    const term = searchTerm.toLowerCase();
    
    return allStories.filter(story => 
      story.name.toLowerCase().includes(term) ||
      story.description.toLowerCase().includes(term)
    );
  }

  // Filter stories by location availability
  async filterStoriesByLocation(hasLocation) {
    const allStories = await this.getAllStories();
    
    if (hasLocation === 'with-location') {
      return allStories.filter(story => story.lat && story.lon);
    } else if (hasLocation === 'no-location') {
      return allStories.filter(story => !story.lat || !story.lon);
    }
    
    return allStories;
  }

  // Sort stories
  async sortStories(sortBy = 'newest') {
    const allStories = await this.getAllStories();
    
    switch (sortBy) {
      case 'newest':
        return allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return allStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
        return allStories.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return allStories;
    }
  }

  // Combined filter, search, and sort
  async queryStories({ searchTerm = '', locationFilter = 'all', sortBy = 'newest' }) {
    let stories = await this.getAllStories();

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      stories = stories.filter(story => 
        story.name.toLowerCase().includes(term) ||
        story.description.toLowerCase().includes(term)
      );
    }

    // Apply location filter
    if (locationFilter === 'with-location') {
      stories = stories.filter(story => story.lat && story.lon);
    } else if (locationFilter === 'no-location') {
      stories = stories.filter(story => !story.lat || !story.lon);
    }

    // Apply sort
    switch (sortBy) {
      case 'newest':
        stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name':
        stories.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return stories;
  }

  // === UTILITY METHODS ===

  // Get database statistics
  async getStats() {
    const stories = await this.getAllStories();
    const pendingStories = await this.getPendingStories();
    const syncQueue = await this.getPendingSyncOperations();

    return {
      totalStories: stories.length,
      storiesWithLocation: stories.filter(s => s.lat && s.lon).length,
      pendingStories: pendingStories.length,
      pendingSyncOperations: syncQueue.length,
      lastUpdated: stories.length > 0 
        ? Math.max(...stories.map(s => new Date(s.createdAt).getTime()))
        : null
    };
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
const dbManager = new IndexedDBManager();

export default dbManager;

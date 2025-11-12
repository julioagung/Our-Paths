// Sync Manager for handling offline/online synchronization
import dbManager from './indexed-db.js';
import { addStory, getStories } from './api.js';
import { logActivity } from '../pages/notification/notification-page.js';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
    this.setupOnlineListener();
  }

  // Setup online/offline event listeners
  setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online! Starting sync...');
      logActivity('sync', 'Connection Restored', 'Device is back online, syncing data...');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Offline mode activated');
      logActivity('sync', 'Offline Mode', 'Device is offline, data will be synced when online');
    });
  }

  // Check if device is online
  isOnline() {
    return navigator.onLine;
  }

  // Add sync listener
  addSyncListener(callback) {
    this.syncListeners.push(callback);
  }

  // Remove sync listener
  removeSyncListener(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
  }

  // Notify all listeners
  notifySyncListeners(event) {
    this.syncListeners.forEach(callback => callback(event));
  }

  // === SYNC OPERATIONS ===

  // Sync all pending data when coming back online
  async syncPendingData() {
    if (this.isSyncing) {
      console.log('Sync already in progress...');
      return;
    }

    if (!this.isOnline()) {
      console.log('Device is offline, cannot sync');
      return;
    }

    this.isSyncing = true;
    this.notifySyncListeners({ type: 'sync-start' });

    try {
      // Get pending stories
      const pendingStories = await dbManager.getPendingStories();
      
      if (pendingStories.length === 0) {
        console.log('No pending stories to sync');
        this.isSyncing = false;
        this.notifySyncListeners({ type: 'sync-complete', success: true, synced: 0 });
        return;
      }

      console.log(`📤 Syncing ${pendingStories.length} pending stories...`);
      
      let successCount = 0;
      let failCount = 0;

      // Sync each pending story
      for (const pendingStory of pendingStories) {
        try {
          await this.syncPendingStory(pendingStory);
          successCount++;
          
          this.notifySyncListeners({ 
            type: 'sync-progress', 
            current: successCount + failCount,
            total: pendingStories.length 
          });
        } catch (error) {
          console.error('Failed to sync story:', error);
          failCount++;
        }
      }

      // Refresh stories from server after sync
      await this.refreshStoriesFromServer();

      const message = `Synced ${successCount} stories${failCount > 0 ? `, ${failCount} failed` : ''}`;
      console.log(`✅ ${message}`);
      logActivity('sync', 'Sync Complete', message);

      this.notifySyncListeners({ 
        type: 'sync-complete', 
        success: true, 
        synced: successCount,
        failed: failCount 
      });

    } catch (error) {
      console.error('Sync failed:', error);
      logActivity('error', 'Sync Failed', 'Error occurred during synchronization');
      
      this.notifySyncListeners({ 
        type: 'sync-complete', 
        success: false, 
        error: error.message 
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single pending story
  async syncPendingStory(pendingStory) {
    const { tempId, description, photoBlob, lat, lon } = pendingStory;

    // Convert blob back to file if needed
    let photo = photoBlob;
    if (photoBlob instanceof Blob && !(photoBlob instanceof File)) {
      photo = new File([photoBlob], `photo-${tempId}.jpg`, { type: 'image/jpeg' });
    }

    // Upload to server
    const result = await addStory({ 
      description, 
      photo, 
      lat: lat || undefined, 
      lon: lon || undefined 
    });

    if (result.error === false) {
      // Remove from pending stories
      await dbManager.deletePendingStory(tempId);
      
      // Add to sync queue as completed
      await dbManager.addToSyncQueue({
        type: 'story-upload',
        tempId,
        serverId: result.story?.id,
        status: 'completed'
      });

      console.log(`✅ Synced story ${tempId}`);
      return result;
    } else {
      throw new Error(result.message || 'Failed to sync story');
    }
  }

  // Save story for offline (when device is offline)
  async saveStoryOffline(storyData) {
    const { description, photo, lat, lon } = storyData;

    // Convert photo to blob for storage
    let photoBlob = photo;
    if (photo instanceof File) {
      photoBlob = await this.fileToBlob(photo);
    }

    // Save to pending stories
    const tempId = await dbManager.savePendingStory({
      description,
      photoBlob,
      lat,
      lon,
      status: 'pending'
    });

    // Add to sync queue
    await dbManager.addToSyncQueue({
      type: 'story-upload',
      tempId,
      status: 'pending'
    });

    console.log(`💾 Story saved offline with tempId: ${tempId}`);
    logActivity('offline', 'Story Saved Offline', 'Story will be uploaded when online');

    return { tempId, success: true };
  }

  // Convert File to Blob
  fileToBlob(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result], { type: file.type });
        resolve(blob);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // === DATA REFRESH ===

  // Refresh stories from server and update IndexedDB
  async refreshStoriesFromServer() {
    if (!this.isOnline()) {
      console.log('Device is offline, using cached data');
      return await dbManager.getAllStories();
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, skipping server refresh');
        return await dbManager.getAllStories();
      }

      // Fetch from server
      const data = await getStories({ location: 1, size: 100 });
      
      if (data.error === false && data.listStory) {
        // Clear old cache
        await dbManager.clearAllStories();
        
        // Save new data
        await dbManager.saveStories(data.listStory);
        
        console.log(`📥 Refreshed ${data.listStory.length} stories from server`);
        logActivity('sync', 'Data Refreshed', `${data.listStory.length} stories updated from server`);
        
        return data.listStory;
      }

      return await dbManager.getAllStories();
    } catch (error) {
      console.error('Failed to refresh from server:', error);
      // Return cached data on error
      return await dbManager.getAllStories();
    }
  }

  // Load stories (from cache or server)
  async loadStories() {
    // First, try to get from cache
    const cachedStories = await dbManager.getAllStories();

    if (this.isOnline()) {
      // If online, refresh from server in background
      this.refreshStoriesFromServer().catch(err => {
        console.error('Background refresh failed:', err);
      });
    }

    return cachedStories;
  }

  // === MANUAL SYNC TRIGGER ===

  // Manually trigger sync
  async manualSync() {
    if (!this.isOnline()) {
      throw new Error('Device is offline. Please connect to the internet to sync.');
    }

    await this.syncPendingData();
  }

  // === STATUS METHODS ===

  // Get sync status
  async getSyncStatus() {
    const pendingStories = await dbManager.getPendingStories();
    const syncQueue = await dbManager.getPendingSyncOperations();
    const stats = await dbManager.getStats();

    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      pendingStories: pendingStories.length,
      pendingSyncOperations: syncQueue.length,
      cachedStories: stats.totalStories,
      lastSync: stats.lastUpdated
    };
  }

  // Check if there are pending syncs
  async hasPendingSync() {
    const pendingStories = await dbManager.getPendingStories();
    return pendingStories.length > 0;
  }
}

// Create singleton instance
const syncManager = new SyncManager();

export default syncManager;

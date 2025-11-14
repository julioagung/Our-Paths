// Sync Manager for Our Paths Application
// Handles offline operations and synchronization

import dbManager from './indexed-db.js';
import { addStory } from './api.js';

class SyncManager {
  constructor() {
    this.dbManager = dbManager;
    this.syncListeners = [];
    this.isSyncing = false;
    this.autoSyncEnabled = true;
    this.syncInterval = null;
  }

  /**
   * Initialize the sync manager
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.dbManager.isInitialized()) {
      await this.dbManager.init();
    }
    
    // Start auto-sync
    this.startAutoSync();
    
    console.log('[SyncManager] Initialized');
  }

  // ==================== OFFLINE OPERATIONS ====================

  /**
   * Save story offline when no connection
   * @param {Object} storyData - Story data (description, photo, lat, lon)
   * @returns {Promise<number>} Queue ID
   */
  async saveStoryOffline(storyData) {
    try {
      const { description, photo, lat, lon } = storyData;
      
      // Convert File to Blob for IndexedDB storage
      const photoBlob = await this.fileToBlob(photo);
      
      const operation = {
        type: 'add_story',
        data: {
          description,
          photo: photoBlob,
          photoName: photo.name,
          photoType: photo.type,
          lat,
          lon
        },
        status: 'pending',
        createdAt: new Date().toISOString(),
        attempts: 0
      };

      const queueId = await this.dbManager.addToQueue(operation);
      
      // Update sync status
      await this.updateSyncStatusCounts();
      
      // Notify listeners
      this.notifySyncListeners({
        type: 'story-queued',
        queueId,
        operation
      });

      console.log('[SyncManager] Story saved offline:', queueId);
      
      // Try to register background sync
      await this.registerBackgroundSync();
      
      return queueId;
    } catch (error) {
      console.error('[SyncManager] Failed to save story offline:', error);
      throw error;
    }
  }

  /**
   * Queue an operation for later sync
   * @param {Object} operation - Operation object
   * @returns {Promise<number>} Queue ID
   */
  async queueOperation(operation) {
    try {
      const queueId = await this.dbManager.addToQueue(operation);
      await this.updateSyncStatusCounts();
      return queueId;
    } catch (error) {
      console.error('[SyncManager] Failed to queue operation:', error);
      throw error;
    }
  }

  // ==================== SYNC OPERATIONS ====================

  /**
   * Sync all pending operations
   * @returns {Promise<Object>} Sync results
   */
  async syncAll() {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return { synced: 0, failed: 0, skipped: 0 };
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Cannot sync: offline');
      return { synced: 0, failed: 0, skipped: 0 };
    }

    this.isSyncing = true;
    
    try {
      const pendingItems = await this.dbManager.getQueueItemsByStatus('pending');
      
      if (pendingItems.length === 0) {
        console.log('[SyncManager] No pending items to sync');
        this.isSyncing = false;
        return { synced: 0, failed: 0, skipped: 0 };
      }

      this.notifySyncListeners({
        type: 'sync-start',
        total: pendingItems.length
      });

      const results = {
        synced: 0,
        failed: 0,
        skipped: 0
      };

      for (const item of pendingItems) {
        try {
          const success = await this.syncStory(item.id);
          if (success) {
            results.synced++;
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error('[SyncManager] Error syncing item:', item.id, error);
          results.failed++;
        }
      }

      // Update sync status
      await this.dbManager.updateSyncStatus({
        lastSync: new Date().toISOString(),
        isOnline: navigator.onLine,
        isSyncing: false
      });

      await this.updateSyncStatusCounts();

      this.notifySyncListeners({
        type: 'sync-complete',
        success: results.failed === 0,
        ...results
      });

      console.log('[SyncManager] Sync complete:', results);
      
      this.isSyncing = false;
      return results;
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      this.isSyncing = false;
      
      this.notifySyncListeners({
        type: 'sync-error',
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Sync a single story from queue
   * @param {number} queueId - Queue item ID
   * @returns {Promise<boolean>} Success status
   */
  async syncStory(queueId) {
    try {
      const operation = await this.dbManager.getQueueItem(queueId);
      
      if (!operation) {
        console.warn('[SyncManager] Queue item not found:', queueId);
        return false;
      }

      // Update status to syncing
      operation.status = 'syncing';
      operation.lastAttempt = new Date().toISOString();
      await this.dbManager.updateQueueItem(operation);

      // Convert Blob back to File
      const photoFile = this.blobToFile(
        operation.data.photo,
        operation.data.photoName,
        operation.data.photoType
      );

      // Submit to API
      const result = await addStory({
        description: operation.data.description,
        photo: photoFile,
        lat: operation.data.lat,
        lon: operation.data.lon
      });

      if (result.error === false) {
        // Success - remove from queue
        await this.dbManager.removeFromQueue(queueId);
        
        this.notifySyncListeners({
          type: 'story-synced',
          queueId,
          storyId: result.story?.id
        });
        
        console.log('[SyncManager] Story synced successfully:', queueId);
        return true;
      } else {
        // API error - mark as failed
        operation.status = 'failed';
        operation.error = result.message || 'Unknown error';
        operation.attempts++;
        
        // Retry logic: mark as pending if attempts < 3
        if (operation.attempts < 3) {
          operation.status = 'pending';
        }
        
        await this.dbManager.updateQueueItem(operation);
        
        console.error('[SyncManager] Story sync failed:', queueId, result.message);
        return false;
      }
    } catch (error) {
      // Network or other error
      const operation = await this.dbManager.getQueueItem(queueId);
      if (operation) {
        operation.status = 'failed';
        operation.error = error.message;
        operation.attempts++;
        
        // Retry logic
        if (operation.attempts < 3) {
          operation.status = 'pending';
        }
        
        await this.dbManager.updateQueueItem(operation);
      }
      
      console.error('[SyncManager] Story sync error:', queueId, error);
      return false;
    }
  }

  /**
   * Manual sync trigger
   * @returns {Promise<Object>} Sync results
   */
  async manualSync() {
    console.log('[SyncManager] Manual sync triggered');
    
    if (!navigator.onLine) {
      throw new Error('Cannot sync while offline');
    }
    
    return await this.syncAll();
  }

  // ==================== STATUS MANAGEMENT ====================

  /**
   * Get current sync status
   * @returns {Promise<Object>} Sync status
   */
  async getSyncStatus() {
    try {
      const status = await this.dbManager.getSyncStatus();
      const pendingCount = await this.dbManager.getPendingCount();
      const failedCount = await this.dbManager.getFailedCount();
      
      return {
        ...status,
        pendingStories: pendingCount,
        failedStories: failedCount,
        isOnline: navigator.onLine,
        isSyncing: this.isSyncing
      };
    } catch (error) {
      console.error('[SyncManager] Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Get count of pending operations
   * @returns {Promise<number>}
   */
  async getPendingCount() {
    try {
      return await this.dbManager.getPendingCount();
    } catch (error) {
      console.error('[SyncManager] Failed to get pending count:', error);
      return 0;
    }
  }

  /**
   * Get failed operations
   * @returns {Promise<Array>}
   */
  async getFailedOperations() {
    try {
      return await this.dbManager.getQueueItemsByStatus('failed');
    } catch (error) {
      console.error('[SyncManager] Failed to get failed operations:', error);
      return [];
    }
  }

  /**
   * Update sync status counts
   * @private
   */
  async updateSyncStatusCounts() {
    try {
      const pendingCount = await this.dbManager.getPendingCount();
      const failedCount = await this.dbManager.getFailedCount();
      
      await this.dbManager.updateSyncStatus({
        pendingStories: pendingCount,
        failedStories: failedCount,
        isOnline: navigator.onLine
      });
    } catch (error) {
      console.error('[SyncManager] Failed to update sync status:', error);
    }
  }

  // ==================== AUTO-SYNC ====================

  /**
   * Start auto-sync on network reconnection
   */
  startAutoSync() {
    if (!this.autoSyncEnabled) return;

    // Listen for online event
    window.addEventListener('online', async () => {
      console.log('[SyncManager] Network reconnected, starting sync...');
      
      try {
        await this.syncAll();
      } catch (error) {
        console.error('[SyncManager] Auto-sync failed:', error);
      }
    });

    // Listen for offline event
    window.addEventListener('offline', () => {
      console.log('[SyncManager] Network disconnected');
      this.notifySyncListeners({
        type: 'network-offline'
      });
    });

    // Periodic sync check (every 5 minutes)
    this.syncInterval = setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        const pendingCount = await this.getPendingCount();
        if (pendingCount > 0) {
          console.log('[SyncManager] Periodic sync check: syncing pending items');
          await this.syncAll();
        }
      }
    }, 5 * 60 * 1000);

    console.log('[SyncManager] Auto-sync started');
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.autoSyncEnabled = false;
    console.log('[SyncManager] Auto-sync stopped');
  }

  /**
   * Register background sync (if supported)
   * @private
   */
  async registerBackgroundSync() {
    try {
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-stories');
        console.log('[SyncManager] Background sync registered');
      }
    } catch (error) {
      console.log('[SyncManager] Background sync not supported or failed:', error.message);
    }
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Add a sync listener
   * @param {Function} callback - Callback function
   */
  addSyncListener(callback) {
    if (typeof callback === 'function') {
      this.syncListeners.push(callback);
    }
  }

  /**
   * Remove a sync listener
   * @param {Function} callback - Callback function
   */
  removeSyncListener(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all sync listeners
   * @param {Object} event - Event object
   * @private
   */
  notifySyncListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SyncManager] Listener error:', error);
      }
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Convert File to Blob
   * @param {File} file - File object
   * @returns {Promise<Blob>}
   * @private
   */
  async fileToBlob(file) {
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

  /**
   * Convert Blob to File
   * @param {Blob} blob - Blob object
   * @param {string} fileName - File name
   * @param {string} fileType - File type
   * @returns {File}
   * @private
   */
  blobToFile(blob, fileName, fileType) {
    return new File([blob], fileName, { type: fileType });
  }

  /**
   * Retry a failed operation
   * @param {number} queueId - Queue item ID
   * @returns {Promise<boolean>}
   */
  async retryOperation(queueId) {
    try {
      const operation = await this.dbManager.getQueueItem(queueId);
      
      if (!operation) {
        throw new Error('Operation not found');
      }

      // Reset status to pending
      operation.status = 'pending';
      operation.attempts = 0;
      operation.error = null;
      await this.dbManager.updateQueueItem(operation);

      // Try to sync immediately
      return await this.syncStory(queueId);
    } catch (error) {
      console.error('[SyncManager] Failed to retry operation:', error);
      throw error;
    }
  }

  /**
   * Clear all failed operations
   * @returns {Promise<void>}
   */
  async clearFailedOperations() {
    try {
      const failedItems = await this.getFailedOperations();
      
      for (const item of failedItems) {
        await this.dbManager.removeFromQueue(item.id);
      }
      
      await this.updateSyncStatusCounts();
      
      console.log('[SyncManager] Cleared failed operations:', failedItems.length);
    } catch (error) {
      console.error('[SyncManager] Failed to clear failed operations:', error);
      throw error;
    }
  }

  /**
   * Check if there are pending sync operations
   * @returns {Promise<boolean>}
   */
  async hasPendingSync() {
    try {
      const pendingCount = await this.getPendingCount();
      return pendingCount > 0;
    } catch (error) {
      console.error('[SyncManager] Failed to check pending sync:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new SyncManager();

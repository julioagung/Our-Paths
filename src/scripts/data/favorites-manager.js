// Favorites Manager for Our Paths Application
// Handles business logic for favorites management

import dbManager from './indexed-db.js';
import { getStoryDetail } from './api.js';

class FavoritesManager {
  constructor() {
    this.dbManager = dbManager;
    this.listeners = [];
    this.cache = null;
    this.cacheTimestamp = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize the favorites manager
   * @returns {Promise<void>}
   */
  async init() {
    if (!this.dbManager.isInitialized()) {
      await this.dbManager.init();
    }
    console.log('[FavoritesManager] Initialized');
  }

  // ==================== CORE OPERATIONS ====================

  /**
   * Add a story to favorites
   * Fetches full story data from API if needed
   * @param {string|Object} storyIdOrObject - Story ID or story object
   * @returns {Promise<void>}
   */
  async addToFavorites(storyIdOrObject) {
    try {
      let story;
      
      if (typeof storyIdOrObject === 'string') {
        // Fetch story from API
        const response = await getStoryDetail(storyIdOrObject);
        if (response.error) {
          throw new Error(response.message || 'Failed to fetch story');
        }
        story = response.story;
      } else {
        story = storyIdOrObject;
      }

      await this.dbManager.addFavorite(story);
      
      // Invalidate cache
      this.invalidateCache();
      
      // Notify listeners
      this.notifyListeners({
        type: 'added',
        storyId: story.id,
        story
      });

      console.log('[FavoritesManager] Added to favorites:', story.id);
    } catch (error) {
      console.error('[FavoritesManager] Failed to add favorite:', error);
      throw error;
    }
  }

  /**
   * Remove a story from favorites
   * @param {string} storyId - Story ID
   * @returns {Promise<void>}
   */
  async removeFromFavorites(storyId) {
    try {
      await this.dbManager.removeFavorite(storyId);
      
      // Invalidate cache
      this.invalidateCache();
      
      // Notify listeners
      this.notifyListeners({
        type: 'removed',
        storyId
      });

      console.log('[FavoritesManager] Removed from favorites:', storyId);
    } catch (error) {
      console.error('[FavoritesManager] Failed to remove favorite:', error);
      throw error;
    }
  }

  /**
   * Check if a story is in favorites
   * @param {string} storyId - Story ID
   * @returns {Promise<boolean>}
   */
  async isFavorite(storyId) {
    try {
      return await this.dbManager.isFavorite(storyId);
    } catch (error) {
      console.error('[FavoritesManager] Failed to check favorite:', error);
      return false;
    }
  }

  /**
   * Get all favorites with caching
   * @param {boolean} forceRefresh - Force refresh from database
   * @returns {Promise<Array>}
   */
  async getFavorites(forceRefresh = false) {
    try {
      // Check cache
      if (!forceRefresh && this.isCacheValid()) {
        console.log('[FavoritesManager] Returning cached favorites');
        return this.cache;
      }

      // Fetch from database
      const favorites = await this.dbManager.getAllFavorites();
      
      // Update cache
      this.cache = favorites;
      this.cacheTimestamp = Date.now();
      
      return favorites;
    } catch (error) {
      console.error('[FavoritesManager] Failed to get favorites:', error);
      throw error;
    }
  }

  /**
   * Get favorites count
   * @returns {Promise<number>}
   */
  async getFavoritesCount() {
    try {
      const favorites = await this.getFavorites();
      return favorites.length;
    } catch (error) {
      console.error('[FavoritesManager] Failed to get favorites count:', error);
      return 0;
    }
  }

  // ==================== SEARCH & FILTER ====================

  /**
   * Search favorites by query
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async searchFavorites(query) {
    try {
      if (!query || query.trim() === '') {
        return await this.getFavorites();
      }
      return await this.dbManager.searchFavorites(query);
    } catch (error) {
      console.error('[FavoritesManager] Failed to search favorites:', error);
      throw error;
    }
  }

  /**
   * Filter favorites by criteria
   * @param {Object} filter - Filter options
   * @returns {Promise<Array>}
   */
  async filterFavorites(filter = {}) {
    try {
      let favorites = await this.getFavorites();

      // Filter by location
      if (filter.hasLocation !== undefined) {
        favorites = favorites.filter(story => {
          const hasLocation = story.lat && story.lon;
          return filter.hasLocation ? hasLocation : !hasLocation;
        });
      }

      // Filter by date range
      if (filter.dateFrom) {
        const fromDate = new Date(filter.dateFrom);
        favorites = favorites.filter(story => 
          new Date(story.favoritedAt) >= fromDate
        );
      }

      if (filter.dateTo) {
        const toDate = new Date(filter.dateTo);
        favorites = favorites.filter(story => 
          new Date(story.favoritedAt) <= toDate
        );
      }

      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        favorites = favorites.filter(story =>
          story.name.toLowerCase().includes(query) ||
          story.description.toLowerCase().includes(query)
        );
      }

      return favorites;
    } catch (error) {
      console.error('[FavoritesManager] Failed to filter favorites:', error);
      throw error;
    }
  }

  /**
   * Sort favorites
   * @param {string} sortBy - Sort criteria: 'newest', 'oldest', 'name'
   * @returns {Promise<Array>}
   */
  async sortFavorites(sortBy = 'newest') {
    try {
      return await this.dbManager.sortFavorites(sortBy);
    } catch (error) {
      console.error('[FavoritesManager] Failed to sort favorites:', error);
      throw error;
    }
  }

  // ==================== DATA SYNC ====================

  /**
   * Refresh a single favorite from API
   * @param {string} storyId - Story ID
   * @returns {Promise<void>}
   */
  async syncFavoriteData(storyId) {
    try {
      const response = await getStoryDetail(storyId);
      
      if (response.error) {
        // Story might be deleted
        console.warn('[FavoritesManager] Story not found, removing from favorites:', storyId);
        await this.removeFromFavorites(storyId);
        return;
      }

      const story = response.story;
      await this.dbManager.addFavorite(story);
      
      this.invalidateCache();
      
      console.log('[FavoritesManager] Synced favorite data:', storyId);
    } catch (error) {
      console.error('[FavoritesManager] Failed to sync favorite:', error);
      throw error;
    }
  }

  /**
   * Refresh all favorites from API
   * @returns {Promise<Object>} Sync results
   */
  async refreshFavorites() {
    try {
      const favorites = await this.getFavorites(true);
      const results = {
        total: favorites.length,
        synced: 0,
        removed: 0,
        failed: 0
      };

      for (const favorite of favorites) {
        try {
          await this.syncFavoriteData(favorite.id);
          results.synced++;
        } catch (error) {
          results.failed++;
        }
      }

      this.invalidateCache();
      
      console.log('[FavoritesManager] Refresh complete:', results);
      return results;
    } catch (error) {
      console.error('[FavoritesManager] Failed to refresh favorites:', error);
      throw error;
    }
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Add a listener for favorites changes
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Remove a listener
   * @param {Function} callback - Callback function to remove
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all listeners of changes
   * @param {Object} event - Event object
   * @private
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[FavoritesManager] Listener error:', error);
      }
    });
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Check if cache is valid
   * @returns {boolean}
   * @private
   */
  isCacheValid() {
    if (!this.cache || !this.cacheTimestamp) {
      return false;
    }
    return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Invalidate cache
   * @private
   */
  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Clear all favorites (for testing/reset)
   * @returns {Promise<void>}
   */
  async clearAllFavorites() {
    try {
      const favorites = await this.getFavorites(true);
      for (const favorite of favorites) {
        await this.dbManager.removeFavorite(favorite.id);
      }
      this.invalidateCache();
      this.notifyListeners({ type: 'cleared' });
      console.log('[FavoritesManager] Cleared all favorites');
    } catch (error) {
      console.error('[FavoritesManager] Failed to clear favorites:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new FavoritesManager();

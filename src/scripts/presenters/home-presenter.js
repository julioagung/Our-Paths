import { getStories } from '../data/api.js';
import { logActivity } from '../pages/notification/notification-page.js';
import dbManager from '../data/indexed-db.js';
import syncManager from '../data/sync-manager.js';

export default class HomePresenter {
  constructor(view) {
    this.view = view;
    this.stories = [];
    this.activeMarker = null;
  }

  async loadStories() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.view.showLoading();

    try {
      // Initialize IndexedDB
      await dbManager.init();

      // Load from cache first (instant display)
      const cachedStories = await dbManager.getAllStories();
      if (cachedStories.length > 0) {
        this.stories = cachedStories;
        this.view.displayStories(this.stories);
        console.log(`📦 Loaded ${cachedStories.length} stories from cache`);
      }

      // Then fetch from server if online
      if (navigator.onLine) {
        const data = await getStories({ location: 1, size: 100 });
        if (data.error === false) {
          this.stories = data.listStory;
          
          // Update IndexedDB cache
          await dbManager.clearAllStories();
          await dbManager.saveStories(this.stories);
          
          this.view.displayStories(this.stories);
          logActivity('story', 'Stories Loaded', `${this.stories.length} stories loaded from server`);
        } else {
          // If server fails but we have cache, use cache
          if (cachedStories.length === 0) {
            this.view.showError('Failed to load stories.');
            logActivity('error', 'Failed to Load Stories', 'Could not fetch stories from server');
          }
        }
      } else {
        // Offline mode
        if (cachedStories.length === 0) {
          this.view.showError('No cached stories available. Please connect to the internet.');
        }
        logActivity('offline', 'Offline Mode', `Showing ${cachedStories.length} cached stories`);
      }

      // Check for pending syncs
      const hasPending = await syncManager.hasPendingSync();
      if (hasPending) {
        this.view.showSyncBanner();
      }

    } catch (error) {
      console.error('Error loading stories:', error);
      
      // Try to load from cache as fallback
      try {
        const cachedStories = await dbManager.getAllStories();
        if (cachedStories.length > 0) {
          this.stories = cachedStories;
          this.view.displayStories(this.stories);
          this.view.showError('Using cached data. Some stories may be outdated.');
        } else {
          this.view.showError('Error loading stories.');
        }
      } catch (cacheError) {
        this.view.showError('Error loading stories.');
      }
      
      logActivity('error', 'Story Loading Error', 'Error occurred while loading stories');
    }
  }

  onStoryClick(id) {
    const story = this.stories.find(s => s.id === id);
    if (story && story.lat && story.lon) {
      this.view.map.setView([story.lat, story.lon], 15);
      if (this.activeMarker) this.view.map.removeLayer(this.activeMarker);
      this.activeMarker = L.marker([story.lat, story.lon]).addTo(this.view.map)
        .bindPopup(`<b>${story.name}</b><br>${story.description}`).openPopup();
      logActivity('info', 'Story Viewed', `Viewing story: "${story.name}"`);
    }
  }

  getStories() {
    return this.stories;
  }
}

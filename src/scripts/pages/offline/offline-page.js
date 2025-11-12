// Offline Data Management Page
import dbManager from '../../data/indexed-db.js';
import syncManager from '../../data/sync-manager.js';
import { logActivity } from '../notification/notification-page.js';

export default class OfflinePage {
  constructor() {
    this.stories = [];
    this.pendingStories = [];
    this.currentView = 'cached';
  }

  async render() {
    return `
      <div class="offline-container">
        <section class="offline-hero">
          <div class="container">
            <h1>📦 Offline Data Manager</h1>
            <p>Manage your cached stories and pending uploads</p>
          </div>
        </section>

        <section class="offline-stats">
          <div class="container">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-content">
                  <h3 id="cached-count">0</h3>
                  <p>Cached Stories</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                  <h3 id="pending-count">0</h3>
                  <p>Pending Upload</p>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">${navigator.onLine ? '🌐' : '📴'}</div>
                <div class="stat-content">
                  <h3 id="status-text">${navigator.onLine ? 'Online' : 'Offline'}</h3>
                  <p>Connection Status</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="offline-controls">
          <div class="container">
            <div class="controls-bar">
              <div class="view-tabs">
                <button class="tab-btn active" data-view="cached">
                  <span>💾</span> Cached Stories
                </button>
                <button class="tab-btn" data-view="pending">
                  <span>⏳</span> Pending Upload
                </button>
              </div>
              <div class="action-buttons">
                <button class="btn-action" id="sync-btn" ${!navigator.onLine ? 'disabled' : ''}>
                  <span>🔄</span> Sync Now
                </button>
                <button class="btn-action danger" id="clear-cache-btn">
                  <span>🗑️</span> Clear Cache
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="offline-content">
          <div class="container">
            <div id="data-view"></div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    await dbManager.init();
    await this.loadData();
    this.setupEventListeners();
    this.setupConnectionListener();
  }

  async loadData() {
    try {
      this.stories = await dbManager.getAllStories();
      this.pendingStories = await dbManager.getPendingStories();
      
      document.getElementById('cached-count').textContent = this.stories.length;
      document.getElementById('pending-count').textContent = this.pendingStories.length;
      
      this.displayCurrentView();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showNotification('Error loading data', 'error');
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.displayCurrentView();
      });
    });

    // Sync button
    document.getElementById('sync-btn')?.addEventListener('click', async () => {
      await this.handleSync();
    });

    // Clear cache button
    document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
      await this.handleClearCache();
    });
  }

  setupConnectionListener() {
    window.addEventListener('online', () => {
      document.getElementById('status-text').textContent = 'Online';
      document.querySelector('.stat-card:nth-child(3) .stat-icon').textContent = '🌐';
      document.getElementById('sync-btn').disabled = false;
      this.showNotification('Back online! You can sync now.', 'success');
    });

    window.addEventListener('offline', () => {
      document.getElementById('status-text').textContent = 'Offline';
      document.querySelector('.stat-card:nth-child(3) .stat-icon').textContent = '📴';
      document.getElementById('sync-btn').disabled = true;
      this.showNotification('You are offline', 'info');
    });
  }

  displayCurrentView() {
    const dataView = document.getElementById('data-view');
    
    if (this.currentView === 'cached') {
      this.displayCachedStories(dataView);
    } else {
      this.displayPendingStories(dataView);
    }
  }

  displayCachedStories(container) {
    if (this.stories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No Cached Stories</h3>
          <p>Stories will be cached here when you view them</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="search-filter-bar">
        <input type="text" id="search-cached" placeholder="🔍 Search cached stories..." class="search-input">
        <select id="sort-cached" class="sort-select">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name">By Name</option>
        </select>
      </div>
      <div class="data-grid" id="cached-grid"></div>
    `;

    this.renderCachedGrid();

    // Setup search and sort
    document.getElementById('search-cached')?.addEventListener('input', (e) => {
      this.filterCachedStories(e.target.value);
    });

    document.getElementById('sort-cached')?.addEventListener('change', (e) => {
      this.sortCachedStories(e.target.value);
    });
  }

  renderCachedGrid(filteredStories = null) {
    const grid = document.getElementById('cached-grid');
    const storiesToShow = filteredStories || this.stories;

    grid.innerHTML = storiesToShow.map(story => `
      <div class="data-card" data-id="${story.id}">
        <div class="card-image">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy">
        </div>
        <div class="card-content">
          <h4>${story.name}</h4>
          <p>${story.description.substring(0, 100)}...</p>
          <div class="card-meta">
            <span>📅 ${new Date(story.createdAt).toLocaleDateString()}</span>
            ${story.lat && story.lon ? '<span>📍 Has Location</span>' : ''}
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-delete" data-id="${story.id}">
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>
    `).join('');

    // Setup delete buttons
    grid.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        await this.deleteCachedStory(id);
      });
    });
  }

  displayPendingStories(container) {
    if (this.pendingStories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No Pending Stories</h3>
          <p>All your stories are synced!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="data-grid">
        ${this.pendingStories.map(story => `
          <div class="data-card pending" data-temp-id="${story.tempId}">
            <div class="pending-badge">⏳ Pending Upload</div>
            <div class="card-content">
              <h4>Offline Story</h4>
              <p>${story.description.substring(0, 100)}...</p>
              <div class="card-meta">
                <span>📅 ${new Date(story.timestamp).toLocaleDateString()}</span>
                ${story.lat && story.lon ? '<span>📍 Has Location</span>' : ''}
              </div>
            </div>
            <div class="card-actions">
              <button class="btn-delete-pending" data-temp-id="${story.tempId}">
                <span>🗑️</span> Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Setup delete buttons
    container.querySelectorAll('.btn-delete-pending').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tempId = parseInt(e.currentTarget.dataset.tempId);
        await this.deletePendingStory(tempId);
      });
    });
  }

  async filterCachedStories(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = this.stories.filter(story =>
      story.name.toLowerCase().includes(term) ||
      story.description.toLowerCase().includes(term)
    );
    this.renderCachedGrid(filtered);
  }

  async sortCachedStories(sortBy) {
    let sorted = [...this.stories];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    
    this.renderCachedGrid(sorted);
  }

  async deleteCachedStory(id) {
    const confirmed = confirm('Delete this cached story? You can reload it from the server.');
    if (!confirmed) return;

    try {
      await dbManager.deleteStory(id);
      this.stories = this.stories.filter(s => s.id !== id);
      document.getElementById('cached-count').textContent = this.stories.length;
      this.displayCurrentView();
      this.showNotification('Story deleted from cache', 'success');
      logActivity('delete', 'Cached Story Deleted', 'Story removed from local cache');
    } catch (error) {
      console.error('Error deleting story:', error);
      this.showNotification('Error deleting story', 'error');
    }
  }

  async deletePendingStory(tempId) {
    const confirmed = confirm('Delete this pending story? This cannot be undone.');
    if (!confirmed) return;

    try {
      await dbManager.deletePendingStory(tempId);
      this.pendingStories = this.pendingStories.filter(s => s.tempId !== tempId);
      document.getElementById('pending-count').textContent = this.pendingStories.length;
      this.displayCurrentView();
      this.showNotification('Pending story deleted', 'success');
      logActivity('delete', 'Pending Story Deleted', 'Offline story removed');
    } catch (error) {
      console.error('Error deleting pending story:', error);
      this.showNotification('Error deleting story', 'error');
    }
  }

  async handleSync() {
    if (!navigator.onLine) {
      this.showNotification('Cannot sync while offline', 'error');
      return;
    }

    const syncBtn = document.getElementById('sync-btn');
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span>⏳</span> Syncing...';

    try {
      await syncManager.manualSync();
      await this.loadData();
      this.showNotification('Sync completed successfully!', 'success');
      logActivity('sync', 'Manual Sync', 'User triggered manual synchronization');
    } catch (error) {
      console.error('Sync error:', error);
      this.showNotification(error.message || 'Sync failed', 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span>🔄</span> Sync Now';
    }
  }

  async handleClearCache() {
    const confirmed = confirm('Clear all cached stories? You can reload them from the server.');
    if (!confirmed) return;

    try {
      await dbManager.clearAllStories();
      this.stories = [];
      document.getElementById('cached-count').textContent = 0;
      this.displayCurrentView();
      this.showNotification('Cache cleared successfully', 'success');
      logActivity('delete', 'Cache Cleared', 'All cached stories removed');
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.showNotification('Error clearing cache', 'error');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `offline-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

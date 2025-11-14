// Favorites Page for Our Paths Application
import favoritesManager from '../../data/favorites-manager.js';

export default class FavoritesPage {
  constructor() {
    this.favorites = [];
    this.filteredFavorites = [];
    this.currentView = 'grid'; // 'grid' or 'list'
    this.currentSort = 'newest';
  }

  async render() {
    const userName = localStorage.getItem('name') || 'Explorer';
    
    return `
      <div class="favorites-container">
        <!-- Header Section -->
        <section class="favorites-header">
          <div class="container">
            <div class="header-content">
              <div class="header-text">
                <h1 class="page-title">
                  <span class="title-icon">❤️</span>
                  My <span class="gradient-text">Favorites</span>
                </h1>
                <p class="page-subtitle">Your collection of amazing stories</p>
              </div>
              <div class="header-stats">
                <div class="stat-badge">
                  <span class="stat-number" id="favorites-count">0</span>
                  <span class="stat-label">Favorites</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Filter & Search Section -->
        <section class="filter-section">
          <div class="container">
            <div class="filter-card">
              <div class="filter-header">
                <h2>Browse Favorites</h2>
                <div class="view-toggle">
                  <button class="view-btn active" data-view="grid" title="Grid View">
                    <span>⊞</span>
                  </button>
                  <button class="view-btn" data-view="list" title="List View">
                    <span>☰</span>
                  </button>
                </div>
              </div>
              
              <div class="filter-controls">
                <div class="search-box">
                  <span class="search-icon">🔍</span>
                  <input type="text" id="favorites-search" placeholder="Search favorites...">
                </div>
                
                <div class="filter-dropdown">
                  <label for="location-filter">
                    <span class="filter-icon">📍</span>
                    Filter:
                  </label>
                  <select id="location-filter">
                    <option value="all">All Stories</option>
                    <option value="with-location">With Location</option>
                    <option value="no-location">Without Location</option>
                  </select>
                </div>
                
                <div class="sort-dropdown">
                  <label for="sort-select">
                    <span class="sort-icon">⇅</span>
                    Sort:
                  </label>
                  <select id="sort-select">
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">By Name</option>
                  </select>
                </div>

                <button class="refresh-btn" id="refresh-favorites" title="Refresh favorites">
                  <span class="refresh-icon">🔄</span>
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Favorites List Section -->
        <section class="favorites-list-section">
          <div class="container">
            <div id="favorites-list" class="favorites-grid"></div>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    // Setup event listeners
    this.setupSearch();
    this.setupFilters();
    this.setupSort();
    this.setupViewToggle();
    this.setupRefresh();
    
    // Load favorites
    await this.loadFavorites();
    
    // Listen for favorites changes
    favoritesManager.addListener(this.handleFavoritesChange.bind(this));
  }

  async loadFavorites() {
    try {
      this.showLoading();
      this.favorites = await favoritesManager.getFavorites();
      this.filteredFavorites = [...this.favorites];
      this.displayFavorites(this.filteredFavorites);
      this.updateCount();
    } catch (error) {
      console.error('[FavoritesPage] Failed to load favorites:', error);
      this.showError('Failed to load favorites. Please try again.');
    }
  }

  displayFavorites(favorites) {
    const listElement = document.getElementById('favorites-list');
    const countElement = document.getElementById('favorites-count');
    
    if (!listElement) return;

    // Update count
    if (countElement) {
      countElement.textContent = favorites.length;
    }

    // Show empty state if no favorites
    if (favorites.length === 0) {
      this.showEmpty();
      return;
    }

    // Display favorites
    listElement.innerHTML = favorites.map((story, index) => {
      const date = new Date(story.favoritedAt || story.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      return `
        <div class="favorite-card" data-id="${story.id}" style="animation-delay: ${index * 0.05}s">
          <div class="favorite-card-image">
            <img src="${story.photoUrl}" alt="${story.name}" loading="lazy">
            <div class="favorite-card-overlay">
              <button class="favorite-view-btn" data-id="${story.id}">
                <span>👁️</span> View Story
              </button>
            </div>
            ${story.lat && story.lon ? '<div class="location-badge"><span>📍</span></div>' : ''}
            <button class="favorite-remove-btn" data-id="${story.id}" title="Remove from favorites">
              <span>❤️</span>
            </button>
          </div>
          <div class="favorite-card-content">
            <div class="favorite-card-header">
              <h3 class="favorite-card-title">${story.name}</h3>
              <div class="favorite-card-date">
                <span class="date-icon">📅</span>
                <span>${formattedDate}</span>
              </div>
            </div>
            <p class="favorite-card-description">${story.description.length > 120 ? story.description.substring(0, 120) + '...' : story.description}</p>
            <div class="favorite-card-footer">
              <div class="story-author">
                <div class="author-avatar">👤</div>
                <span>${story.name}</span>
              </div>
              ${story.lat && story.lon ? `
                <div class="story-location">
                  <span class="location-icon">🌍</span>
                  <span>Location Available</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to remove buttons
    document.querySelectorAll('.favorite-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        this.handleRemoveFavorite(storyId);
      });
    });

    // Add event listeners to view buttons
    document.querySelectorAll('.favorite-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.id;
        this.handleViewStory(storyId);
      });
    });

    // Add event listeners to cards
    document.querySelectorAll('.favorite-card').forEach(card => {
      card.addEventListener('click', () => {
        const storyId = card.dataset.id;
        this.handleViewStory(storyId);
      });
    });
  }

  showLoading() {
    const listElement = document.getElementById('favorites-list');
    if (listElement) {
      listElement.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p>Loading your favorites...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const listElement = document.getElementById('favorites-list');
    if (listElement) {
      listElement.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="btn-primary">Try Again</button>
        </div>
      `;
    }
  }

  showEmpty() {
    const listElement = document.getElementById('favorites-list');
    if (listElement) {
      listElement.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">💔</div>
          <h3>No favorites yet</h3>
          <p>Start adding stories to your favorites to see them here!</p>
          <a href="#/" class="btn-primary">Browse Stories</a>
        </div>
      `;
    }
  }

  setupSearch() {
    const searchInput = document.getElementById('favorites-search');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.applyFilters();
        }, 300);
      });
    }
  }

  setupFilters() {
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter) {
      locationFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }
  }

  setupSort() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', async (e) => {
        this.currentSort = e.target.value;
        await this.applySort();
      });
    }
  }

  setupViewToggle() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const listElement = document.getElementById('favorites-list');
    
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        this.currentView = view;
        
        if (listElement) {
          listElement.className = view === 'grid' ? 'favorites-grid' : 'favorites-list-view';
        }
      });
    });
  }

  setupRefresh() {
    const refreshBtn = document.getElementById('refresh-favorites');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('loading');
        
        try {
          await this.loadFavorites();
          this.showNotification('Favorites refreshed!', 'success');
        } catch (error) {
          this.showNotification('Failed to refresh favorites', 'error');
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.classList.remove('loading');
        }
      });
    }
  }

  async applyFilters() {
    const searchInput = document.getElementById('favorites-search');
    const locationFilter = document.getElementById('location-filter');
    
    let filtered = [...this.favorites];

    // Apply search
    if (searchInput && searchInput.value) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter(story =>
        story.name.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query)
      );
    }

    // Apply location filter
    if (locationFilter) {
      const filterValue = locationFilter.value;
      if (filterValue === 'with-location') {
        filtered = filtered.filter(story => story.lat && story.lon);
      } else if (filterValue === 'no-location') {
        filtered = filtered.filter(story => !story.lat || !story.lon);
      }
    }

    this.filteredFavorites = filtered;
    await this.applySort();
  }

  async applySort() {
    try {
      // Sort the filtered favorites
      this.filteredFavorites.sort((a, b) => {
        switch (this.currentSort) {
          case 'newest':
            return new Date(b.favoritedAt || b.createdAt) - new Date(a.favoritedAt || a.createdAt);
          case 'oldest':
            return new Date(a.favoritedAt || a.createdAt) - new Date(b.favoritedAt || b.createdAt);
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      this.displayFavorites(this.filteredFavorites);
    } catch (error) {
      console.error('[FavoritesPage] Failed to sort favorites:', error);
    }
  }

  async handleRemoveFavorite(storyId) {
    const confirmed = confirm('Remove this story from favorites?');
    if (!confirmed) return;

    try {
      await favoritesManager.removeFromFavorites(storyId);
      this.showNotification('Removed from favorites', 'success');
      
      // Reload favorites
      await this.loadFavorites();
    } catch (error) {
      console.error('[FavoritesPage] Failed to remove favorite:', error);
      this.showNotification('Failed to remove favorite', 'error');
    }
  }

  handleViewStory(storyId) {
    // Navigate to home page (stories are displayed there)
    window.location.hash = '#/';
  }

  handleFavoritesChange(event) {
    console.log('[FavoritesPage] Favorites changed:', event);
    // Reload favorites when changes occur
    this.loadFavorites();
  }

  updateCount() {
    const countElement = document.getElementById('favorites-count');
    if (countElement) {
      countElement.textContent = this.favorites.length;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `favorites-notification ${type}`;
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

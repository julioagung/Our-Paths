import HomePresenter from '../../presenters/home-presenter.js';

export default class HomePage {
  constructor() {
    this.presenter = new HomePresenter(this);
    this.map = null;
    this.markers = [];
    this.backgroundMusic = null;
  }

  async render() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('name') || 'Explorer';
    
    if (!token) {
      return `
        <section class="container">
          <h1>Our Paths</h1>
          <p>Please <a href="#/login">login</a> to view stories.</p>
        </section>
      `;
    }

    return `
      <div class="home-container">
        <!-- Hero Section with Mentor Avatar -->
        <section class="hero-section">
          <div class="container">
            <div class="hero-content">
              <div class="hero-text">
                <div class="welcome-badge">
                  <span class="badge-icon">👋</span>
                  <span>Welcome back!</span>
                </div>
                <h1 class="hero-title">
                  Hello, <span class="gradient-text">${userName}</span>
                </h1>
                <p class="hero-subtitle">Discover amazing stories from around the world and share your own adventures</p>
                <div class="hero-stats">
                  <div class="stat-card">
                    <div class="stat-icon">📖</div>
                    <div class="stat-info">
                      <div class="stat-value" id="total-stories">0</div>
                      <div class="stat-label">Total Stories</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">📍</div>
                    <div class="stat-info">
                      <div class="stat-value" id="location-stories">0</div>
                      <div class="stat-label">With Location</div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-icon">🌍</div>
                    <div class="stat-info">
                      <div class="stat-value" id="countries">0</div>
                      <div class="stat-label">Countries</div>
                    </div>
                  </div>
                </div>
                <a href="#/add" class="hero-cta-btn">
                  <span class="cta-icon">✨</span>
                  <span class="cta-text">Share Your Story</span>
                  <span class="cta-arrow">→</span>
                </a>
              </div>
              <div class="hero-avatar">
                <div class="avatar-container">
                  <img src="/images/luffy.jpg" alt="Mentor Avatar" class="mentor-avatar">
                  <div class="avatar-badge">
                    <span>🎯</span>
                  </div>
                </div>
                <div class="mentor-tooltip">
                  <div class="tooltip-arrow"></div>
                  <p>"Let's explore stories together! Click on any story to see it on the map!"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Filter & Search Section -->
        <section class="filter-section-modern">
          <div class="container">
            <div class="filter-card">
              <div class="filter-header">
                <h2>Explore Stories</h2>
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
                  <input type="text" id="search-input" placeholder="Search stories...">
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
              </div>
            </div>
          </div>
        </section>

        <!-- Main Content Section -->
        <section class="main-section">
          <div class="container">
            <div class="content-grid">
              <!-- Stories Section -->
              <div class="stories-section">
                <div class="section-header">
                  <h3>Latest Stories</h3>
                  <div class="section-actions">
                    <span class="story-count" id="story-count">0 stories</span>
                    <a href="#/add" class="add-story-btn-small">
                      <span>➕</span>
                      <span>Add Story</span>
                    </a>
                  </div>
                </div>
                <div id="story-list" class="story-grid"></div>
              </div>

              <!-- Map Section -->
              <div class="map-section">
                <div class="map-card">
                  <div class="map-header">
                    <h3>Story Locations</h3>
                    <div class="map-controls">
                      <button class="map-control-btn" id="center-map" title="Center Map">
                        <span>🎯</span>
                      </button>
                      <button class="map-control-btn" id="fullscreen-map" title="Fullscreen">
                        <span>⛶</span>
                      </button>
                    </div>
                  </div>
                  <div id="map" class="map-container-modern"></div>
                  <div class="map-legend">
                    <div class="legend-item">
                      <span class="legend-marker">📍</span>
                      <span>Story Location</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Floating Action Button -->
        <a href="#/add" class="fab-add-story" title="Add New Story">
          <span class="fab-icon">✍️</span>
          <span class="fab-text">Add Story</span>
        </a>

        <!-- Background Music Player -->
        <div class="music-player" id="music-player">
          <button class="music-toggle" id="music-toggle" title="Toggle Music">
            <span class="music-icon">🎵</span>
          </button>
          <div class="music-info">
            <span class="music-text">Background Music</span>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const listElement = document.getElementById('story-list');
    const filterElement = document.getElementById('location-filter');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const viewBtns = document.querySelectorAll('.view-btn');
    const centerMapBtn = document.getElementById('center-map');
    const fullscreenMapBtn = document.getElementById('fullscreen-map');

    // Initialize background music
    this.initBackgroundMusic();

    // Initialize map with multiple tile layers
    this.map = L.map('map').setView([-6.2, 106.816666], 10);

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });

    const baseLayers = {
      "Street": osmLayer,
      "Satellite": satelliteLayer
    };

    osmLayer.addTo(this.map);
    L.control.layers(baseLayers).addTo(this.map);

    // Load stories
    await this.presenter.loadStories();

    // Setup sync status indicator
    this.setupSyncStatusIndicator();

    // View toggle functionality
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        listElement.className = view === 'grid' ? 'story-grid' : 'story-list-view';
      });
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.applyFilters();
      });
    }

    // Filter functionality
    if (filterElement) {
      filterElement.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    // Sort functionality
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    // Sync list and map
    listElement.addEventListener('click', (e) => {
      const storyCard = e.target.closest('.story-card');
      if (storyCard) {
        const id = storyCard.dataset.id;
        this.presenter.onStoryClick(id);
      }
    });

    // Center map button
    if (centerMapBtn) {
      centerMapBtn.addEventListener('click', () => {
        this.map.setView([-6.2, 106.816666], 10);
      });
    }

    // Fullscreen map button
    if (fullscreenMapBtn) {
      fullscreenMapBtn.addEventListener('click', () => {
        const mapCard = document.querySelector('.map-card');
        if (!document.fullscreenElement) {
          mapCard.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
          });
        } else {
          document.exitFullscreen();
        }
      });
    }
  }

  applyFilters() {
    const searchInput = document.getElementById('search-input');
    const filterElement = document.getElementById('location-filter');
    const sortSelect = document.getElementById('sort-select');
    
    let filteredStories = [...this.presenter.getStories()];

    // Apply search filter
    if (searchInput && searchInput.value) {
      const searchTerm = searchInput.value.toLowerCase();
      filteredStories = filteredStories.filter(story => 
        story.name.toLowerCase().includes(searchTerm) ||
        story.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply location filter
    if (filterElement) {
      const filterValue = filterElement.value;
      if (filterValue === 'with-location') {
        filteredStories = filteredStories.filter(story => story.lat && story.lon);
      } else if (filterValue === 'no-location') {
        filteredStories = filteredStories.filter(story => !story.lat || !story.lon);
      }
    }

    // Apply sort
    if (sortSelect) {
      const sortValue = sortSelect.value;
      if (sortValue === 'newest') {
        filteredStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortValue === 'oldest') {
        filteredStories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortValue === 'name') {
        filteredStories.sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    this.displayStories(filteredStories);
  }

  showLoading() {
    const listElement = document.getElementById('story-list');
    if (listElement) {
      listElement.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <p>Loading amazing stories...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const listElement = document.getElementById('story-list');
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

  displayStories(stories) {
    const listElement = document.getElementById('story-list');
    const storyCount = document.getElementById('story-count');
    const totalStories = document.getElementById('total-stories');
    const locationStories = document.getElementById('location-stories');
    const countries = document.getElementById('countries');

    // Update stats
    if (storyCount) storyCount.textContent = `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`;
    if (totalStories) totalStories.textContent = stories.length;
    if (locationStories) {
      const withLocation = stories.filter(s => s.lat && s.lon).length;
      locationStories.textContent = withLocation;
    }
    if (countries) {
      // Estimate countries (simplified)
      const withLocation = stories.filter(s => s.lat && s.lon).length;
      countries.textContent = Math.min(withLocation, 10);
    }

    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers.length = 0;

    if (stories.length === 0) {
      listElement.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon">📭</div>
          <h3>No stories found</h3>
          <p>Try adjusting your filters or be the first to share a story!</p>
          <a href="#/add" class="btn-primary">Add Story</a>
        </div>
      `;
      return;
    }

    // Display list with modern card design
    listElement.innerHTML = stories.map((story, index) => {
      const date = new Date(story.createdAt);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      return `
        <div class="story-card" data-id="${story.id}" tabindex="0" style="animation-delay: ${index * 0.05}s">
          <div class="story-card-image">
            <img src="${story.photoUrl}" alt="${story.name} story" loading="lazy">
            <div class="story-card-overlay">
              <button class="story-view-btn">
                <span>👁️</span> View on Map
              </button>
            </div>
            ${story.lat && story.lon ? '<div class="location-badge"><span>📍</span></div>' : ''}
          </div>
          <div class="story-card-content">
            <div class="story-card-header">
              <h3 class="story-card-title">${story.name}</h3>
              <div class="story-card-date">
                <span class="date-icon">📅</span>
                <span>${formattedDate}</span>
              </div>
            </div>
            <p class="story-card-description">${story.description.length > 120 ? story.description.substring(0, 120) + '...' : story.description}</p>
            <div class="story-card-footer">
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

    // Add markers for stories with location
    stories.forEach(story => {
      if (story.lat && story.lon) {
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-pin">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        const marker = L.marker([story.lat, story.lon], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(`
            <div class="custom-popup">
              <img src="${story.photoUrl}" alt="${story.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
              <h4 style="margin: 0 0 8px 0; font-size: 1rem;">${story.name}</h4>
              <p style="margin: 0; font-size: 0.85rem; color: #666;">${story.description.substring(0, 100)}...</p>
            </div>
          `);
        this.markers.push(marker);
      }
    });
  }

  filterStories(filter) {
    if (filter === 'with-location') {
      return this.presenter.getStories().filter(story => story.lat && story.lon);
    }
    return this.presenter.getStories();
  }

  setupSyncStatusIndicator() {
    // Import sync manager dynamically
    import('../../data/sync-manager.js').then(({ default: syncManager }) => {
      // Listen for sync events
      syncManager.addSyncListener((event) => {
        if (event.type === 'sync-start') {
          this.showSyncNotification('Syncing pending stories...', 'info');
        } else if (event.type === 'sync-complete') {
          if (event.success) {
            this.showSyncNotification(
              `✅ Synced ${event.synced} stories successfully!`, 
              'success'
            );
            // Reload stories after sync
            this.presenter.loadStories();
          } else {
            this.showSyncNotification('❌ Sync failed. Will retry later.', 'error');
          }
        }
      });

      // Check sync status on load
      syncManager.getSyncStatus().then(status => {
        if (status.pendingStories > 0) {
          this.showSyncBanner(status.pendingStories);
        }
      });
    });
  }

  showSyncBanner(pendingCount = 0) {
    const existingBanner = document.querySelector('.sync-banner');
    if (existingBanner) return;

    const banner = document.createElement('div');
    banner.className = 'sync-banner';
    banner.innerHTML = `
      <div class="container">
        <div class="sync-banner-content">
          <div class="sync-icon">🔄</div>
          <div class="sync-text">
            <strong>${pendingCount} story(ies) pending sync</strong>
            <p>Will be uploaded when you're back online</p>
          </div>
          <button class="sync-now-btn" id="sync-now-btn">
            <span>⚡</span> Sync Now
          </button>
        </div>
      </div>
    `;

    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.parentNode.insertBefore(banner, heroSection.nextSibling);
      
      setTimeout(() => banner.classList.add('show'), 100);

      document.getElementById('sync-now-btn')?.addEventListener('click', async () => {
        const btn = document.getElementById('sync-now-btn');
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Syncing...';

        try {
          const { default: syncManager } = await import('../../data/sync-manager.js');
          await syncManager.manualSync();
          banner.classList.remove('show');
          setTimeout(() => banner.remove(), 300);
        } catch (error) {
          this.showSyncNotification(error.message, 'error');
          btn.disabled = false;
          btn.innerHTML = '<span>⚡</span> Sync Now';
        }
      });
    }
  }

  showSyncNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `sync-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  initBackgroundMusic() {
    // Create audio element
    this.backgroundMusic = new Audio('https://voca.ro/11lMbpM28GPg');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;

    const musicToggle = document.getElementById('music-toggle');
    const musicPlayer = document.getElementById('music-player');

    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      // Auto play music after login - force play with user interaction workaround
      setTimeout(() => {
        const playPromise = this.backgroundMusic.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Background music started playing');
            musicToggle.classList.add('playing');
          }).catch(err => {
            console.log('Auto-play prevented, trying alternative method:', err);
            // Try to play on any user interaction
            const playOnInteraction = () => {
              this.backgroundMusic.play().then(() => {
                musicToggle.classList.add('playing');
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              });
            };
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
          });
        }
        sessionStorage.removeItem('justLoggedIn');
      }, 300);
    } else {
      // Auto play for returning users (already on home page)
      setTimeout(() => {
        this.backgroundMusic.play().then(() => {
          musicToggle.classList.add('playing');
        }).catch(err => {
          console.log('Auto-play prevented:', err);
        });
      }, 500);
    }

    // Toggle music on button click
    musicToggle?.addEventListener('click', () => {
      if (this.backgroundMusic.paused) {
        this.backgroundMusic.play();
        musicToggle.classList.add('playing');
      } else {
        this.backgroundMusic.pause();
        musicToggle.classList.remove('playing');
      }
    });

    // Show player on hover
    musicPlayer?.addEventListener('mouseenter', () => {
      musicPlayer.classList.add('expanded');
    });

    musicPlayer?.addEventListener('mouseleave', () => {
      musicPlayer.classList.remove('expanded');
    });
  }
}

import { addStory } from '../../data/api.js';
import { logActivity } from '../notification/notification-page.js';
import PushNotificationManager from '../../utils/push-notification.js';

export default class AddPage {
  constructor() {
    this.currentStep = 1;
    this.storyData = {
      description: '',
      photo: null,
      lat: null,
      lon: null
    };
  }

  async render() {
    const isLoggedIn = !!localStorage.getItem('token');
    const userName = localStorage.getItem('name') || 'Explorer';

    return `
      <div class="add-story-container">
        <!-- Welcome Section -->
        <section class="add-story-welcome">
          <div class="container">
            <div class="welcome-content">
              <div class="welcome-avatar">
                <img src="/images/luffy.jpg" alt="Luffy" class="luffy-guide">
                <div class="speech-bubble">
                  <p>"Hey ${userName}! Ready to share an amazing adventure? Let's create something awesome together! 🚀"</p>
                </div>
              </div>
              <div class="welcome-text">
                <h1 class="welcome-title">Share Your <span class="gradient-text">Story</span></h1>
                <p class="welcome-subtitle">Every moment deserves to be remembered. Let's capture yours!</p>
                <div class="welcome-stats">
                  <div class="stat-item">
                    <span class="stat-icon">📸</span>
                    <span class="stat-text">Add Photo</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">📝</span>
                    <span class="stat-text">Write Story</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">📍</span>
                    <span class="stat-text">Pin Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        ${!isLoggedIn ? `
        <section class="auth-mode-section">
          <div class="container">
            <div class="auth-mode-card">
              <h2>Choose Your Mode</h2>
              <div class="auth-modes">
                <div class="auth-mode-option" data-mode="guest">
                  <div class="mode-icon">🎭</div>
                  <h3>Guest Mode</h3>
                  <p>Share anonymously without account</p>
                  <span class="mode-badge">Quick & Easy</span>
                </div>
                <div class="auth-mode-option" data-mode="login">
                  <div class="mode-icon">👤</div>
                  <h3>Login First</h3>
                  <p>Get full features with your account</p>
                  <span class="mode-badge">Recommended</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        ` : ''}

        <section class="progress-section">
          <div class="container">
            <div class="progress-steps">
              <div class="step-item active" data-step="1">
                <div class="step-circle">
                  <span class="step-number">1</span>
                  <span class="step-check">✓</span>
                </div>
                <span class="step-label">Photo</span>
              </div>
              <div class="step-line"></div>
              <div class="step-item" data-step="2">
                <div class="step-circle">
                  <span class="step-number">2</span>
                  <span class="step-check">✓</span>
                </div>
                <span class="step-label">Story</span>
              </div>
              <div class="step-line"></div>
              <div class="step-item" data-step="3">
                <div class="step-circle">
                  <span class="step-number">3</span>
                  <span class="step-check">✓</span>
                </div>
                <span class="step-label">Location</span>
              </div>
            </div>
          </div>
        </section>

        <section class="add-story-form-section">
          <div class="container">
            <form id="add-form" class="add-story-form" enctype="multipart/form-data">
              
              <div class="form-step active" data-step="1">
                <div class="step-card">
                  <h2 class="step-title">📸 Choose Your Photo</h2>
                  <p class="step-description">Upload a photo or take one with your camera</p>
                  
                  <div class="photo-upload-area" id="photo-upload-area">
                    <input type="file" id="photo" name="photo" accept="image/*" hidden>
                    <div class="upload-placeholder" id="upload-placeholder">
                      <div class="upload-icon">🖼️</div>
                      <h3>Drop your photo here</h3>
                      <p>or click to browse</p>
                      <div class="upload-actions">
                        <button type="button" class="btn-upload" id="browse-btn">
                          <span>📁</span> Browse Files
                        </button>
                        <button type="button" class="btn-camera" id="camera-btn">
                          <span>📷</span> Take Photo
                        </button>
                      </div>
                      <small class="upload-hint">Supports: JPG, PNG (Max 1MB)</small>
                    </div>
                    <div class="photo-preview" id="photo-preview" style="display: none;">
                      <img id="preview-image" src="" alt="Preview">
                      <div class="preview-overlay">
                        <button type="button" class="btn-change-photo" id="change-photo-btn">
                          <span>🔄</span> Change Photo
                        </button>
                        <button type="button" class="btn-remove-photo" id="remove-photo-btn">
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                      <div class="photo-info" id="photo-info"></div>
                    </div>
                  </div>

                  <div class="step-navigation">
                    <button type="button" class="btn-next" id="next-step-1" disabled>
                      Next Step <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-step" data-step="2">
                <div class="step-card">
                  <h2 class="step-title">📝 Tell Your Story</h2>
                  <p class="step-description">Share what makes this moment special</p>
                  
                  <div class="description-area">
                    <textarea 
                      id="description" 
                      name="description" 
                      placeholder="Once upon a time..."
                      maxlength="500"
                    ></textarea>
                    <div class="textarea-footer">
                      <span class="char-count"><span id="char-count">0</span>/500</span>
                      <div class="writing-tips">
                        <button type="button" class="tip-btn" data-tip="adventure">✨ Adventure</button>
                        <button type="button" class="tip-btn" data-tip="food">🍜 Food</button>
                        <button type="button" class="tip-btn" data-tip="nature">🌿 Nature</button>
                      </div>
                    </div>
                  </div>

                  <div class="step-navigation">
                    <button type="button" class="btn-back" id="back-step-2">
                      <span>←</span> Back
                    </button>
                    <button type="button" class="btn-next" id="next-step-2" disabled>
                      Next Step <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-step" data-step="3">
                <div class="step-card">
                  ${isLoggedIn ? `
                  <div class="guest-mode-toggle">
                    <div class="toggle-content">
                      <div class="toggle-info">
                        <span class="toggle-icon">🎭</span>
                        <div class="toggle-text">
                          <h4>Anonymous Mode</h4>
                          <p>Post this story without your account name</p>
                        </div>
                      </div>
                      <label class="toggle-switch">
                        <input type="checkbox" id="anonymous-toggle">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                    <div class="toggle-status" id="toggle-status">
                      <span class="status-icon">👤</span>
                      <span class="status-text">Posting with your account</span>
                    </div>
                  </div>
                  ` : ''}
                  
                  <h2 class="step-title">📍 Pin Your Location</h2>
                  <p class="step-description">Where did this story happen? (Optional)</p>
                  
                  <div class="location-options">
                    <button type="button" class="location-option" id="use-current-location">
                      <span class="option-icon">🎯</span>
                      <div class="option-content">
                        <h4>Use Current Location</h4>
                        <p>Automatically detect where you are</p>
                      </div>
                    </button>
                    <button type="button" class="location-option" id="pick-on-map">
                      <span class="option-icon">🗺️</span>
                      <div class="option-content">
                        <h4>Pick on Map</h4>
                        <p>Choose location manually</p>
                      </div>
                    </button>
                    <button type="button" class="location-option" id="skip-location">
                      <span class="option-icon">⏭️</span>
                      <div class="option-content">
                        <h4>Skip Location</h4>
                        <p>Continue without location</p>
                      </div>
                    </button>
                  </div>

                  <div class="map-container-add" id="map-container" style="display: none;">
                    <div id="map" class="map-add"></div>
                    <div class="map-info" id="map-info">
                      <span class="info-icon">📍</span>
                      <span class="info-text">Click on the map to set location</span>
                    </div>
                  </div>

                  <input type="hidden" id="lat" name="lat">
                  <input type="hidden" id="lon" name="lon">

                  <div class="step-navigation">
                    <button type="button" class="btn-back" id="back-step-3">
                      <span>←</span> Back
                    </button>
                    <button type="submit" class="btn-submit" id="submit-story">
                      <span class="submit-icon">🚀</span>
                      <span class="submit-text">Publish Story</span>
                      <span class="submit-loader"></span>
                    </button>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </section>
      </div>
    `;
  }

  async afterRender() {
    this.setupAuthModeSelection();
    this.setupPhotoUpload();
    this.setupCamera();
    this.setupDescription();
    this.setupLocation();
    this.setupAnonymousToggle();
    this.setupStepNavigation();
    this.setupFormSubmission();
  }

  setupAnonymousToggle() {
    const toggle = document.getElementById('anonymous-toggle');
    const statusElement = document.getElementById('toggle-status');
    
    if (toggle && statusElement) {
      toggle.addEventListener('change', () => {
        if (toggle.checked) {
          statusElement.innerHTML = `
            <span class="status-icon">🎭</span>
            <span class="status-text">Posting anonymously</span>
          `;
          statusElement.classList.add('anonymous');
          this.showNotification('Anonymous mode enabled - Your identity will be hidden', 'info');
        } else {
          statusElement.innerHTML = `
            <span class="status-icon">👤</span>
            <span class="status-text">Posting with your account</span>
          `;
          statusElement.classList.remove('anonymous');
          this.showNotification('Anonymous mode disabled - Posting with your account', 'info');
        }
      });
    }
  }

  setupAuthModeSelection() {
    const authModes = document.querySelectorAll('.auth-mode-option');
    authModes.forEach(mode => {
      mode.addEventListener('click', () => {
        const modeType = mode.dataset.mode;
        if (modeType === 'login') {
          window.location.hash = '#/login';
        } else {
          // Guest mode selected
          const authSection = document.querySelector('.auth-mode-section');
          if (authSection) {
            authSection.style.display = 'none';
          }
          
          // Show guest info banner
          this.showGuestBanner();
          
          // Set guest mode flag
          sessionStorage.setItem('guestMode', 'true');
          
          this.showNotification('Continuing as Guest - Your story will be posted anonymously', 'info');
        }
      });
    });
  }

  showGuestBanner() {
    const banner = document.createElement('div');
    banner.className = 'guest-mode-banner';
    banner.innerHTML = `
      <div class="container">
        <div class="banner-content">
          <div class="banner-icon">🎭</div>
          <div class="banner-text">
            <h4>Guest Mode Active</h4>
            <p>You're posting anonymously. <a href="#/register" class="banner-link">Create an account</a> to get full features!</p>
          </div>
          <button class="banner-close" id="close-guest-banner">✕</button>
        </div>
      </div>
    `;
    
    const progressSection = document.querySelector('.progress-section');
    if (progressSection) {
      progressSection.parentNode.insertBefore(banner, progressSection);
      
      setTimeout(() => banner.classList.add('show'), 100);
      
      document.getElementById('close-guest-banner')?.addEventListener('click', () => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300);
      });
    }
  }

  setupPhotoUpload() {
    const photoInput = document.getElementById('photo');
    const uploadArea = document.getElementById('photo-upload-area');
    const browseBtn = document.getElementById('browse-btn');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const removePhotoBtn = document.getElementById('remove-photo-btn');

    if (browseBtn) {
      browseBtn.addEventListener('click', () => photoInput.click());
    }

    if (uploadArea) {
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          photoInput.files = files;
          this.handlePhotoSelect(files[0]);
        }
      });
    }

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handlePhotoSelect(e.target.files[0]);
        }
      });
    }

    if (changePhotoBtn) {
      changePhotoBtn.addEventListener('click', () => photoInput.click());
    }

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        photoInput.value = '';
        document.getElementById('upload-placeholder').style.display = 'flex';
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('next-step-1').disabled = true;
        this.storyData.photo = null;
      });
    }
  }

  handlePhotoSelect(file) {
    if (file.size > 1024 * 1024) {
      this.showNotification('File size must be less than 1MB', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showNotification('Please select an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('preview-image').src = e.target.result;
      document.getElementById('upload-placeholder').style.display = 'none';
      document.getElementById('photo-preview').style.display = 'block';
      document.getElementById('next-step-1').disabled = false;
      
      const sizeKB = (file.size / 1024).toFixed(2);
      document.getElementById('photo-info').innerHTML = `
        <span class="info-item">📏 ${sizeKB} KB</span>
        <span class="info-item">📐 ${file.name}</span>
      `;
      
      this.storyData.photo = file;
    };
    reader.readAsDataURL(file);
  }

  setupCamera() {
    const cameraBtn = document.getElementById('camera-btn');
    
    if (cameraBtn) {
      cameraBtn.addEventListener('click', async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          this.showCameraModal(stream);
        } catch (error) {
          this.showNotification('Camera access denied or not available', 'error');
        }
      });
    }
  }

  showCameraModal(stream) {
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-modal-content">
        <div class="camera-header">
          <h3>📷 Take a Photo</h3>
          <button class="camera-close" id="camera-close">✕</button>
        </div>
        <div class="camera-viewport">
          <video id="camera-video" autoplay playsinline></video>
          <div class="camera-overlay">
            <div class="camera-frame"></div>
          </div>
        </div>
        <div class="camera-controls">
          <button class="camera-flip" id="camera-flip">🔄</button>
          <button class="camera-capture" id="camera-capture">
            <span class="capture-ring"></span>
            <span class="capture-button"></span>
          </button>
          <button class="camera-cancel" id="camera-cancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const video = document.getElementById('camera-video');
    video.srcObject = stream;
    
    setTimeout(() => modal.classList.add('show'), 10);

    document.getElementById('camera-capture').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        document.getElementById('photo').files = dataTransfer.files;
        
        this.handlePhotoSelect(file);
        
        stream.getTracks().forEach(track => track.stop());
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        
        this.showNotification('Photo captured successfully!', 'success');
      }, 'image/jpeg', 0.9);
    });

    const closeCamera = () => {
      stream.getTracks().forEach(track => track.stop());
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    document.getElementById('camera-close').addEventListener('click', closeCamera);
    document.getElementById('camera-cancel').addEventListener('click', closeCamera);
  }

  setupDescription() {
    const descriptionInput = document.getElementById('description');
    const charCount = document.getElementById('char-count');
    const nextBtn = document.getElementById('next-step-2');
    const tipBtns = document.querySelectorAll('.tip-btn');

    if (descriptionInput) {
      descriptionInput.addEventListener('input', () => {
        const length = descriptionInput.value.length;
        charCount.textContent = length;
        
        nextBtn.disabled = length < 10;
        
        if (length < 10) {
          charCount.style.color = '#ef4444';
        } else if (length < 100) {
          charCount.style.color = '#f59e0b';
        } else {
          charCount.style.color = '#10b981';
        }
        
        this.storyData.description = descriptionInput.value;
      });
    }

    const tips = {
      adventure: "An amazing adventure where I discovered...",
      food: "The taste of this delicious meal was...",
      nature: "Surrounded by nature's beauty, I felt..."
    };

    tipBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tip = tips[btn.dataset.tip];
        if (tip && !descriptionInput.value) {
          descriptionInput.value = tip;
          descriptionInput.focus();
          descriptionInput.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  setupLocation() {
    const useCurrentBtn = document.getElementById('use-current-location');
    const pickOnMapBtn = document.getElementById('pick-on-map');
    const skipLocationBtn = document.getElementById('skip-location');
    const mapContainer = document.getElementById('map-container');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');

    let map = null;
    let marker = null;

    if (useCurrentBtn) {
      useCurrentBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              latInput.value = position.coords.latitude;
              lonInput.value = position.coords.longitude;
              useCurrentBtn.classList.add('selected');
              this.showNotification('Location detected successfully!', 'success');
            },
            () => {
              this.showNotification('Could not get your location', 'error');
            }
          );
        }
      });
    }

    if (pickOnMapBtn) {
      pickOnMapBtn.addEventListener('click', () => {
        mapContainer.style.display = 'block';
        pickOnMapBtn.classList.add('selected');
        
        if (!map) {
          map = L.map('map').setView([-6.2, 106.816666], 10);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          map.on('click', (e) => {
            if (marker) map.removeLayer(marker);
            marker = L.marker(e.latlng).addTo(map);
            latInput.value = e.latlng.lat;
            lonInput.value = e.latlng.lng;
          });
        }
        
        setTimeout(() => map.invalidateSize(), 100);
      });
    }

    if (skipLocationBtn) {
      skipLocationBtn.addEventListener('click', () => {
        latInput.value = '';
        lonInput.value = '';
        skipLocationBtn.classList.add('selected');
        this.showNotification('Continuing without location', 'info');
      });
    }
  }

  setupStepNavigation() {
    const nextStep1 = document.getElementById('next-step-1');
    const nextStep2 = document.getElementById('next-step-2');
    const backStep2 = document.getElementById('back-step-2');
    const backStep3 = document.getElementById('back-step-3');
    
    if (nextStep1) nextStep1.addEventListener('click', () => this.goToStep(2));
    if (nextStep2) nextStep2.addEventListener('click', () => this.goToStep(3));
    if (backStep2) backStep2.addEventListener('click', () => this.goToStep(1));
    if (backStep3) backStep3.addEventListener('click', () => this.goToStep(2));
  }

  goToStep(stepNumber) {
    const steps = document.querySelectorAll('.form-step');
    const stepItems = document.querySelectorAll('.step-item');
    
    steps.forEach(step => {
      step.classList.remove('active');
      if (parseInt(step.dataset.step) === stepNumber) {
        step.classList.add('active');
      }
    });

    stepItems.forEach(item => {
      const itemStep = parseInt(item.dataset.step);
      if (itemStep < stepNumber) {
        item.classList.add('completed');
        item.classList.remove('active');
      } else if (itemStep === stepNumber) {
        item.classList.add('active');
        item.classList.remove('completed');
      } else {
        item.classList.remove('active', 'completed');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentStep = stepNumber;
  }

  setupFormSubmission() {
    const form = document.getElementById('add-form');
    
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Check if anonymous toggle is enabled
        const anonymousToggle = document.getElementById('anonymous-toggle');
        const forceGuest = anonymousToggle ? anonymousToggle.checked : false;
        
        await this.handleSubmit(forceGuest);
      });
    }
  }

  async handleSubmit(forceGuest = false) {
    const photoInput = document.getElementById('photo');
    const descriptionInput = document.getElementById('description');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    const submitBtn = document.getElementById('submit-story');
    const submitAsGuestBtn = document.getElementById('submit-as-guest');

    const description = descriptionInput.value;
    const photo = photoInput.files[0];
    const lat = latInput.value ? parseFloat(latInput.value) : undefined;
    const lon = lonInput.value ? parseFloat(lonInput.value) : undefined;

    if (!description || !photo) {
      this.showNotification('Please complete all required fields', 'error');
      return;
    }

    const isLoggedIn = !!localStorage.getItem('token');
    const willPostAsGuest = forceGuest || !isLoggedIn;
    
    // Show confirmation for guest posting
    if (willPostAsGuest) {
      const confirmed = await this.showGuestConfirmation(isLoggedIn);
      if (!confirmed) {
        return;
      }
    }

    // Disable both buttons
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    if (submitAsGuestBtn) {
      submitAsGuestBtn.disabled = true;
      submitAsGuestBtn.classList.add('loading');
    }

    try {
      // Check if online
      const isOnline = navigator.onLine;

      if (!isOnline) {
        // Save offline
        const { default: syncManager } = await import('../../data/sync-manager.js');
        const { default: dbManager } = await import('../../data/indexed-db.js');
        
        await dbManager.init();
        await syncManager.saveStoryOffline({ description, photo, lat, lon });
        
        logActivity('offline', 'Story Saved Offline', 'Story will be uploaded when online');
        this.showNotification('📴 Saved offline! Will sync when you\'re back online.', 'info');
        
        sessionStorage.removeItem('guestMode');
        this.showSuccessModal(willPostAsGuest, true); // true = offline mode
        return;
      }

      // Temporarily remove token if posting as guest
      let tempToken = null;
      if (forceGuest && isLoggedIn) {
        tempToken = localStorage.getItem('token');
        localStorage.removeItem('token');
      }

      const result = await addStory({ description, photo, lat, lon });
      
      // Restore token if it was removed
      if (tempToken) {
        localStorage.setItem('token', tempToken);
      }

      if (result.error === false) {
        const locationText = lat && lon ? 'with location' : 'without location';
        const modeText = willPostAsGuest ? 'as guest' : 'with account';
        logActivity('add', 'Story Added', `New story added ${locationText} ${modeText}`);
        
        // Trigger push notification for new story
        await this.triggerPushNotification(description, photo);
        
        sessionStorage.removeItem('guestMode');
        
        this.showSuccessModal(willPostAsGuest);
      } else {
        logActivity('error', 'Failed to Add Story', result.message);
        this.showNotification(result.message || 'Failed to add story', 'error');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        if (submitAsGuestBtn) {
          submitAsGuestBtn.disabled = false;
          submitAsGuestBtn.classList.remove('loading');
        }
      }
    } catch (error) {
      logActivity('error', 'Story Upload Error', 'Error occurred while adding story');
      this.showNotification('Error adding story. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      if (submitAsGuestBtn) {
        submitAsGuestBtn.disabled = false;
        submitAsGuestBtn.classList.remove('loading');
      }
    }
  }

  showGuestConfirmation(isLoggedIn = false) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'guest-confirmation-modal';
      
      const title = isLoggedIn ? 'Post Anonymously?' : 'Post as Guest?';
      const description = isLoggedIn 
        ? 'Your story will be posted without your account name attached.' 
        : 'Your story will be posted anonymously without an account.';
      const hintText = isLoggedIn 
        ? 'Your account will remain active, but this story won\'t be linked to it.' 
        : '<a href="#/register" class="register-link">Create an account</a> for full features';
      
      modal.innerHTML = `
        <div class="guest-confirmation-overlay"></div>
        <div class="guest-confirmation-content">
          <div class="confirmation-icon">🎭</div>
          <h3>${title}</h3>
          <p>${description}</p>
          <div class="confirmation-features">
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span>Story will be published</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">❌</span>
              <span>Cannot edit or delete later</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">❌</span>
              <span>No author attribution</span>
            </div>
            ${isLoggedIn ? `
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <span>Your identity stays private</span>
            </div>
            ` : ''}
          </div>
          <div class="confirmation-actions">
            <button class="btn-cancel-confirm" id="cancel-guest">
              Cancel
            </button>
            <button class="btn-confirm-guest" id="confirm-guest">
              ${isLoggedIn ? 'Post Anonymously' : 'Continue as Guest'}
            </button>
          </div>
          <p class="confirmation-hint">
            ${hintText}
          </p>
        </div>
      `;
      
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);

      document.getElementById('confirm-guest').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        resolve(true);
      });

      document.getElementById('cancel-guest').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        resolve(false);
      });

      modal.querySelector('.guest-confirmation-overlay').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        resolve(false);
      });
    });
  }

  showSuccessModal(isGuest = false, isOffline = false) {
    const modal = document.createElement('div');
    modal.className = 'success-modal-overlay show';
    
    if (isOffline) {
      modal.innerHTML = `
        <div class="success-modal">
          <div class="success-modal-avatar">
            <img src="/images/luffy.jpg" alt="Success">
          </div>
          <h2 class="success-modal-title">Story Saved! 📴</h2>
          <p class="success-modal-message">Your story is saved offline and will be uploaded automatically when you're back online!</p>
          <div class="guest-success-info">
            <div class="info-card">
              <span class="info-icon">💾</span>
              <p>Saved Locally</p>
            </div>
            <div class="info-card">
              <span class="info-icon">🔄</span>
              <p>Auto-sync when online</p>
            </div>
          </div>
          <button class="success-modal-button" id="view-story-btn">View Stories</button>
        </div>
      `;
    } else if (isGuest) {
      modal.innerHTML = `
        <div class="success-modal">
          <div class="success-modal-avatar">
            <img src="/images/luffy.jpg" alt="Success">
          </div>
          <h2 class="success-modal-title">Story Published! 🎉</h2>
          <p class="success-modal-message">Your anonymous story is now live and inspiring others!</p>
          <div class="guest-success-info">
            <div class="info-card">
              <span class="info-icon">🎭</span>
              <p>Posted as Guest</p>
            </div>
            <div class="info-card">
              <span class="info-icon">💡</span>
              <p>Create account for more features</p>
            </div>
          </div>
          <div class="success-actions">
            <button class="success-modal-button secondary" id="create-account-btn">Create Account</button>
            <button class="success-modal-button" id="view-story-btn">View Stories</button>
          </div>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="success-modal">
          <div class="success-modal-avatar">
            <img src="/images/luffy.jpg" alt="Success">
          </div>
          <h2 class="success-modal-title">Story Published! 🎉</h2>
          <p class="success-modal-message">Your amazing story is now live and ready to inspire others!</p>
          <button class="success-modal-button" id="view-story-btn">View All Stories</button>
        </div>
      `;
    }
    
    document.body.appendChild(modal);
    
    // Confetti animation
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }

    document.getElementById('view-story-btn')?.addEventListener('click', () => {
      window.location.hash = '#/';
    });

    document.getElementById('create-account-btn')?.addEventListener('click', () => {
      window.location.hash = '#/register';
    });

    setTimeout(() => {
      window.location.hash = '#/';
    }, isGuest ? 5000 : 3000);
  }

  async triggerPushNotification(description, photo) {
    try {
      // Check if push notifications are enabled
      const isSubscribed = await PushNotificationManager.isSubscribed();
      
      if (isSubscribed) {
        // Simulate push notification (in real app, this would be sent from server)
        await PushNotificationManager.simulatePush({
          title: '📖 New Story Added!',
          body: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
          icon: '/images/logo.png',
          image: photo ? URL.createObjectURL(photo) : undefined,
          url: '/#/',
          tag: 'new-story'
        });
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `add-story-notification ${type}`;
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

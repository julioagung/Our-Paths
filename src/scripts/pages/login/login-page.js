import { loginUser } from '../../data/api.js';
import { logActivity } from '../notification/notification-page.js';

export default class LoginPage {
  async render() {
    return `
      <div class="auth-container">
        <div class="auth-background">
          <div class="auth-shape shape-1"></div>
          <div class="auth-shape shape-2"></div>
          <div class="auth-shape shape-3"></div>
        </div>
        
        <div class="auth-modal">
          <div class="auth-header">
            <div class="auth-logo">
              <img src="/images/logo.png" alt="Our Paths" class="logo-icon">
              <h1>Our Paths</h1>
            </div>
            <p class="auth-subtitle">Welcome back! Please login to your account</p>
          </div>

          <form id="login-form" class="auth-form">
            <div class="input-group">
              <div class="input-icon">📧</div>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Email address"
                required 
                autocomplete="email"
              >
              <label for="email">Email</label>
            </div>

            <div class="input-group">
              <div class="input-icon">🔒</div>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="Password"
                required
                autocomplete="current-password"
              >
              <label for="password">Password</label>
              <button type="button" class="toggle-password" id="toggle-password" aria-label="Toggle password visibility">
              </button>
            </div>

            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Login</span>
              <span class="btn-loader"></span>
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <div class="auth-footer">
            <p>Don't have an account? <a href="#/register" class="auth-link">Create one</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('login-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const modal = document.querySelector('.auth-modal');

    // Animate modal entrance
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);

    // Toggle password visibility
    togglePassword?.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePassword.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
    });

    // Input focus animations
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          input.parentElement.classList.remove('focused');
        }
      });

      // Check if input has value on load
      if (input.value) {
        input.parentElement.classList.add('focused');
      }
    });

    // Form validation
    emailInput.addEventListener('input', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const inputGroup = emailInput.parentElement;
      
      if (emailInput.value && !emailRegex.test(emailInput.value)) {
        inputGroup.classList.add('error');
        inputGroup.classList.remove('success');
      } else if (emailInput.value) {
        inputGroup.classList.remove('error');
        inputGroup.classList.add('success');
      } else {
        inputGroup.classList.remove('error', 'success');
      }
    });

    passwordInput.addEventListener('input', () => {
      const inputGroup = passwordInput.parentElement;
      
      if (passwordInput.value && passwordInput.value.length < 8) {
        inputGroup.classList.add('error');
        inputGroup.classList.remove('success');
      } else if (passwordInput.value) {
        inputGroup.classList.remove('error');
        inputGroup.classList.add('success');
      } else {
        inputGroup.classList.remove('error', 'success');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const email = formData.get('email');
      const password = formData.get('password');

      if (!email || !password) {
        this.showNotification('Please fill in all fields.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');

      try {
        const result = await loginUser({ email, password });
        if (result.error === false) {
          logActivity('login', 'Login Successful', `Welcome back! You logged in at ${new Date().toLocaleString()}`);
          submitBtn.classList.remove('loading');
          submitBtn.classList.add('success');
          
          // Show success modal with Luffy
          this.showSuccessModal(result.loginResult.name || 'Explorer');
        } else {
          logActivity('error', 'Login Failed', result.message);
          this.showNotification(result.message || 'Login failed. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        logActivity('error', 'Login Error', 'Connection error during login attempt');
        this.showNotification('Connection error. Please check your internet and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  }

  showSuccessModal(userName) {
    // Mark that user just logged in for background music
    sessionStorage.setItem('justLoggedIn', 'true');

    // Create confetti
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 3000);
    }

    // Create modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'success-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="success-modal">
        <div class="success-modal-avatar">
          <img src="/images/luffy.jpg" alt="Success">
        </div>
        <h2 class="success-modal-title">Welcome Back, ${userName}!</h2>
        <p class="success-modal-message">You've successfully logged in. Let's explore amazing stories together!</p>
        <button class="success-modal-button" id="continue-btn">Continue to Dashboard</button>
      </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    setTimeout(() => {
      modalOverlay.classList.add('show');
    }, 100);

    // Continue button
    document.getElementById('continue-btn').addEventListener('click', () => {
      modalOverlay.classList.remove('show');
      setTimeout(() => {
        modalOverlay.remove();
        window.location.hash = '#/';
      }, 300);
    });

    // Auto redirect after 3 seconds
    setTimeout(() => {
      if (document.body.contains(modalOverlay)) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
          modalOverlay.remove();
          window.location.hash = '#/';
        }, 300);
      }
    }, 3000);
  }

  showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.auth-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    `;
    
    document.querySelector('.auth-modal').appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

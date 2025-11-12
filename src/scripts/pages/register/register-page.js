import { registerUser } from '../../data/api.js';
import { logActivity } from '../notification/notification-page.js';

export default class RegisterPage {
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
            <p class="auth-subtitle">Create your account and start sharing stories</p>
          </div>

          <form id="register-form" class="auth-form">
            <div class="input-group">
              <div class="input-icon">👤</div>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Full name"
                required 
                autocomplete="name"
              >
              <label for="name">Name</label>
            </div>

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
                placeholder="Password (min. 8 characters)"
                required
                minlength="8"
                autocomplete="new-password"
              >
              <label for="password">Password</label>
              <button type="button" class="toggle-password" id="toggle-password" aria-label="Toggle password visibility">
              </button>
            </div>

            <div class="password-strength" id="password-strength">
              <div class="strength-bar">
                <div class="strength-fill"></div>
              </div>
              <span class="strength-text">Password strength</span>
            </div>

            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Create Account</span>
              <span class="btn-loader"></span>
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <div class="auth-footer">
            <p>Already have an account? <a href="#/login" class="auth-link">Login here</a></p>
          </div>
        </div>
      </div>
    `;
  }

  async afterRender() {
    const form = document.getElementById('register-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const modal = document.querySelector('.auth-modal');
    const strengthIndicator = document.getElementById('password-strength');

    // Animate modal entrance
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);

    
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

      if (input.value) {
        input.parentElement.classList.add('focused');
      }
    });

    // Form validation
    nameInput.addEventListener('input', () => {
      const inputGroup = nameInput.parentElement;
      
      if (nameInput.value && nameInput.value.trim().length < 2) {
        inputGroup.classList.add('error');
        inputGroup.classList.remove('success');
      } else if (nameInput.value) {
        inputGroup.classList.remove('error');
        inputGroup.classList.add('success');
      } else {
        inputGroup.classList.remove('error', 'success');
      }
    });

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
      const strength = this.calculatePasswordStrength(passwordInput.value);
      
      if (passwordInput.value) {
        strengthIndicator.style.display = 'block';
        const fill = strengthIndicator.querySelector('.strength-fill');
        const text = strengthIndicator.querySelector('.strength-text');
        
        fill.style.width = `${strength.percentage}%`;
        fill.className = `strength-fill ${strength.level}`;
        text.textContent = strength.text;

        if (passwordInput.value.length < 8) {
          inputGroup.classList.add('error');
          inputGroup.classList.remove('success');
        } else {
          inputGroup.classList.remove('error');
          inputGroup.classList.add('success');
        }
      } else {
        strengthIndicator.style.display = 'none';
        inputGroup.classList.remove('error', 'success');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const password = formData.get('password');

      if (!name || !email || !password) {
        this.showNotification('Please fill in all fields.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');

      try {
        const result = await registerUser({ name, email, password });
        if (result.error === false) {
          logActivity('register', 'Registration Successful', `Account created for ${name}. Please login to continue.`);
          submitBtn.classList.remove('loading');
          submitBtn.classList.add('success');
          
          // Show success modal
          this.showSuccessModal(name);
        } else {
          logActivity('error', 'Registration Failed', result.message);
          this.showNotification(result.message || 'Registration failed. Please try again.', 'error');
          submitBtn.disabled = false;
          submitBtn.classList.remove('loading');
        }
      } catch (error) {
        logActivity('error', 'Registration Error', 'Connection error during registration');
        this.showNotification('Connection error. Please check your internet and try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  }

  calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;

    let level = 'weak';
    let text = 'Weak password';
    
    if (strength >= 75) {
      level = 'strong';
      text = 'Strong password';
    } else if (strength >= 50) {
      level = 'medium';
      text = 'Medium password';
    }

    return { percentage: strength, level, text };
  }

  showSuccessModal(userName) {
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
        <h2 class="success-modal-title">Welcome, ${userName}!</h2>
        <p class="success-modal-message">Your account has been created successfully. Please login to start your journey!</p>
        <button class="success-modal-button" id="continue-btn">Go to Login</button>
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
        window.location.hash = '#/login';
      }, 300);
    });

    // Auto redirect after 3 seconds
    setTimeout(() => {
      if (document.body.contains(modalOverlay)) {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
          modalOverlay.remove();
          window.location.hash = '#/login';
        }, 300);
      }
    }, 3000);
  }

  showNotification(message, type = 'info') {
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

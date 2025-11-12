export default class AboutPage {
  constructor() {
    this.comments = this.loadComments();
  }

  loadComments() {
    const saved = localStorage.getItem('aboutComments');
    return saved ? JSON.parse(saved) : [];
  }

  saveComments() {
    localStorage.setItem('aboutComments', JSON.stringify(this.comments));
  }

  async render() {
    return `
      <main class="about-content">
        <!-- Hero Section -->
        <section class="about-hero">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h1 class="hero-title">About Our Paths</h1>
            <p class="hero-subtitle">Share Your Journey, Connect Your Stories</p>
          </div>
        </section>

        <!-- About Website Section -->
        <section class="about-website">
          <div class="container">
            <div class="section-header">
              <i class="fas fa-globe"></i>
              <h2>About This Platform</h2>
            </div>
            <div class="website-info">
              <p>Our Paths adalah platform berbagi cerita yang memungkinkan Anda untuk mendokumentasikan perjalanan hidup Anda dengan cara yang unik dan bermakna. Setiap cerita yang Anda bagikan dapat dilengkapi dengan lokasi geografis, foto, dan narasi yang menggambarkan pengalaman Anda.</p>
              <p>Kami percaya bahwa setiap orang memiliki cerita yang layak untuk dibagikan. Melalui platform ini, Anda dapat menginspirasi orang lain, berbagi pengalaman, dan membangun koneksi dengan komunitas yang memiliki minat yang sama.</p>
              <div class="features-grid">
                <div class="feature-card">
                  <i class="fas fa-map-marked-alt"></i>
                  <h3>Location Tagging</h3>
                  <p>Tandai lokasi cerita Anda di peta interaktif</p>
                </div>
                <div class="feature-card">
                  <i class="fas fa-camera"></i>
                  <h3>Photo Sharing</h3>
                  <p>Upload atau ambil foto langsung dari kamera</p>
                </div>
                <div class="feature-card">
                  <i class="fas fa-users"></i>
                  <h3>Community</h3>
                  <p>Terhubung dengan pengguna lain di seluruh dunia</p>
                </div>
                <div class="feature-card">
                  <i class="fas fa-shield-alt"></i>
                  <h3>Privacy First</h3>
                  <p>Kontrol penuh atas privasi cerita Anda</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Developer Profile Section -->
        <section class="developer-profile">
          <div class="container">
            <div class="section-header">
              <i class="fas fa-code"></i>
              <h2>Meet The Developer</h2>
            </div>
            <div class="profile-card">
              <div class="profile-image-container">
                <img src="/images/profile.jpg" alt="Developer Profile" class="profile-image">
                <div class="profile-badge">
                  <i class="fas fa-check-circle"></i>
                </div>
              </div>
              <div class="profile-info">
                <h3 class="profile-name">Julio Agung Prasetyo</h3>
                <p class="profile-title">F429D5Y0923</p>
                <p class="profile-title">Front End and BackEnd With AI</p>
                <div class="profile-social">
                  <a href="https://github.com/julioagung" class="social-link" aria-label="GitHub">
                    <i class="fab fa-github"></i>
                  </a>
                  <a href="https://www.linkedin.com/in/julio-agung-05889a25b/" class="social-link" aria-label="LinkedIn">
                    <i class="fab fa-linkedin"></i>
                  </a>
                  <a href="https://www.instagram.com/julio_agung/" class="social-link" aria-label="Instagram">
                    <i class="fab fa-instagram"></i>
                  </a>
                  <a href="https://letterboxd.com/julio_agung/" class="social-link" aria-label="Letterboxd">
                    <i class="fas fa-film"></i>
                  </a>
                </div>
                <div class="profile-description">
                  <h4>About Me</h4>
                  <p>Seorang Mahasiswa dari Universitas Dinamika Bangsa Jambi, lahir di jambi, pada 07 Juli 2004. Mengambil kelas front end dan back end with ai, bersama kelas kak Chusnia Dzuriati</p>
                  <p>Memiliki hobi berupa, olahraga, menonton dan mereview film, yang dimana kalian bisa check letterbox aku di sebelah kanan Instagram diatas, Saya berharap semoga Submission ini dapat diterima dengan reviewer sebelum deadline.</p>
                </div>
                <div class="profile-skills">
                  <h4>Skills & Technologies</h4>
                  <div class="skills-tags">
                    <span class="skill-tag">JavaScript</span>
                    <span class="skill-tag">HTML5</span>
                    <span class="skill-tag">CSS3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Comments Section -->
        <section class="comments-section">
          <div class="container">
            <div class="section-header">
              <i class="fas fa-comments"></i>
              <h2>Leave a Comment</h2>
            </div>
            <div class="comment-form-container">
              <form id="commentForm" class="comment-form">
                <div class="form-group">
                  <label for="commentName" class="form-label">Your Name</label>
                  <input type="text" id="commentName" class="form-input" placeholder="Enter your name" required>
                </div>
                <div class="form-group">
                  <label for="commentEmail" class="form-label">Email Address</label>
                  <input type="email" id="commentEmail" class="form-input" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                  <label for="commentMessage" class="form-label">Your Comment</label>
                  <textarea id="commentMessage" class="form-textarea" rows="5" placeholder="Share your thoughts..." required></textarea>
                </div>
                <button type="submit" class="submit-comment-btn">
                  <i class="fas fa-paper-plane"></i>
                  Submit Comment
                </button>
              </form>
            </div>
            <div class="comments-list" id="commentsList">
              <h3 class="comments-title">Recent Comments</h3>
              <div id="commentsContainer">
                <!-- Comments will be dynamically inserted here -->
              </div>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    this.initializeAnimations();
    this.initializeCommentForm();
    this.displayComments();
  }

  initializeAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .profile-card, .comment-form-container').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  initializeCommentForm() {
    const form = document.getElementById('commentForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCommentSubmit(e);
      });
    }
  }

  handleCommentSubmit(e) {
    const name = document.getElementById('commentName').value;
    const email = document.getElementById('commentEmail').value;
    const message = document.getElementById('commentMessage').value;

    const comment = {
      id: Date.now(),
      name,
      email,
      message,
      date: new Date().toISOString()
    };

    this.comments.unshift(comment);
    this.saveComments();
    this.displayComments();

    e.target.reset();
    this.showToast('Comment submitted successfully!');
  }

  displayComments() {
    const container = document.getElementById('commentsContainer');
    if (!container) return;

    if (this.comments.length === 0) {
      container.innerHTML = `
        <div class="no-comments">
          <i class="fas fa-comment-slash"></i>
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.comments.map(comment => {
      const date = new Date(comment.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return `
        <div class="comment-item">
          <div class="comment-avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <h4 class="comment-author">${comment.name}</h4>
              <span class="comment-date">${formattedDate}</span>
            </div>
            <p class="comment-text">${comment.message}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

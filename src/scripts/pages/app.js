import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { logActivity } from './notification/notification-page.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    document.body.appendChild(overlay);

    this.#drawerButton.addEventListener('click', () => {
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.classList.toggle('active', isOpen);
      overlay.classList.toggle('active', isOpen);
      
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Close drawer when clicking overlay
    overlay.addEventListener('click', () => {
      this.#navigationDrawer.classList.remove('open');
      this.#drawerButton.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });

    // Close drawer when clicking links
    this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  showLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('active');
    }
  }

  hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.remove('active');
      }, 500);
    }
  }

  async renderPage() {
    // Show loader
    this.showLoader();

    const url = getActiveRoute();
    const routeKey = `#${url}`;
    const isLoggedIn = !!localStorage.getItem('token');
    
    // Hide/show header and footer based on auth status
    const header = document.querySelector('header');
    const footer = document.querySelector('.footer');
    const mainContent = document.querySelector('.main-content');
    
    if (url === '/login' || url === '/register') {
      header.style.display = 'none';
      footer.style.display = 'none';
      mainContent.style.margin = '0';
      mainContent.style.padding = '0';
      mainContent.style.borderRadius = '0';
      mainContent.style.boxShadow = 'none';
      mainContent.style.minHeight = '100vh';
      mainContent.style.background = 'transparent';
    } else {
      header.style.display = 'block';
      footer.style.display = 'block';
      mainContent.style.margin = '20px';
      mainContent.style.padding = '';
      mainContent.style.borderRadius = '';
      mainContent.style.boxShadow = '';
      mainContent.style.minHeight = 'calc(100vh - 130px)';
      mainContent.style.background = '';
    }
    
    // Check auth for protected routes
    if ((url === '/' || url === '/add') && !isLoggedIn) {
      window.location.hash = '#/login';
      this.hideLoader();
      return;
    }

    const page = routes[routeKey];

    // If page not found, redirect to home or login
    if (!page) {
      console.error(`Route not found: ${routeKey}`);
      window.location.hash = isLoggedIn ? '#/' : '#/login';
      this.hideLoader();
      return;
    }

    // Add page fade animation
    this.#content.classList.add('page-fade-exit');

    // Use View Transition API for smooth page transitions
    if (!document.startViewTransition) {
      // Fallback for browsers without View Transition API
      setTimeout(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
        this.#content.classList.remove('page-fade-exit');
        this.#content.classList.add('page-fade-enter');
        this.hideLoader();
        
        setTimeout(() => {
          this.#content.classList.remove('page-fade-enter');
        }, 500);
      }, 300);
    } else {
      const transition = document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      });
      
      transition.finished.then(() => {
        this.hideLoader();
      });
    }

    // Update page title for accessibility
    const pageTitles = {
      '/': 'Home - Our Paths',
      '/add': 'Add Story - Our Paths',
      '/login': 'Login - Our Paths',
      '/register': 'Register - Our Paths',
      '/about': 'About - Our Paths',
      '/notifications': 'Notifications - Our Paths',
      '/offline': 'Offline Data - Our Paths',
      '/favorites': 'Favorites - Our Paths'
    };
    document.title = pageTitles[url] || 'Our Paths';

    // Update navigation based on auth status
    if (url !== '/login' && url !== '/register') {
      this.#updateNavigation();
    }
  }

  #updateNavigation() {
    const navList = document.getElementById('nav-list');
    const isLoggedIn = !!localStorage.getItem('token');

    const navItems = [
      { href: '#/', text: 'Home' },
      { href: '#/add', text: 'Add Story' },
      { href: '#/favorites', text: 'Favorites' },
      { href: '#/offline', text: 'Offline Data' },
      { href: '#/notifications', text: 'Notifications' },
      { href: '#/about', text: 'About' }
    ];

    if (!isLoggedIn) {
      navItems.push(
        { href: '#/login', text: 'Login' },
        { href: '#/register', text: 'Register' }
      );
    } else {
      navItems.push({ href: '#logout', text: 'Logout', id: 'logout-link' });
    }

    navList.innerHTML = navItems.map(item =>
      `<li><a href="${item.href}" ${item.id ? `id="${item.id}"` : ''}>${item.text}</a></li>`
    ).join('');

    // Add logout event listener
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        const userName = localStorage.getItem('name') || 'User';
        logActivity('logout', 'Logged Out', `${userName} logged out at ${new Date().toLocaleString()}`);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('name');
        window.location.hash = '#/login';
        // Update navigation immediately after logout
        this.#updateNavigation();
      });
    }
  }
}

export default App;

import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import AddPage from '../pages/add/add-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from '../pages/register/register-page';
import NotificationPage from '../pages/notification/notification-page';
import OfflinePage from '../pages/offline/offline-page';
import FavoritesPage from '../pages/favorites/favorites-page';

const routes = {
  '#/': new HomePage(),
  '#/about': new AboutPage(),
  '#/add': new AddPage(),
  '#/login': new LoginPage(),
  '#/register': new RegisterPage(),
  '#/notifications': new NotificationPage(),
  '#/offline': new OfflinePage(),
  '#/favorites': new FavoritesPage(),
};

export default routes;

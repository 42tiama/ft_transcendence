import Home from './static/js/views/Home.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Leaderboard from './static/js/views/Leaderboard.js';
import ChangePass from './static/js/views/ChangePass.js'; // to change the password
import Profile from './static/js/views/Profile.js'; // to check the JWT

const navigateTo = (url: string) => {
  history.pushState(null, '', url);
  void router();
};

const router = async () => {
  const routes = [
    {path: '/', view: Home},
    {path: '/Home', view: Home},
    {path: '/login', view: Login},
    {path: '/register', view: Register},
    {path: '/leaderboard', view: Leaderboard},
		{path: '/changepass', view: ChangePass},
		{path: '/profile', view: Profile},
    // {path: '/404,', view: 404}
  ];

  const potentialMatches = routes.map(route => {
    return {
      route: route,
      isMatch: location.pathname === route.path,
    };
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

  if (!match) {
    match = {
      route: routes[0],
      isMatch: true,
    };
  }

  try {
    const view = new match.route.view() as any;
    const appElement = document.querySelector('#app');

    if (appElement) {
      const html = await view.getHtml();
      appElement.innerHTML = html;
      if (match.route.path === '/login' ||
          match.route.path === '/register' ||
				  match.route.path === '/changepass' ||
				  match.route.path === '/profile'
        ) {
        await view.onMount();
      }
    } else {
      console.error('Could not find #app element');
    }
  } catch (error) {
    console.error('Error rendering view:', error);
  }
};

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e: MouseEvent) => {
    if (
      e.target instanceof HTMLAnchorElement &&
      e.target.matches('[data-link]')
    ) {
      e.preventDefault();
      navigateTo(e.target.href);
    }
  });
  void router();
});

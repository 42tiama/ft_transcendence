import Dashboard from './static/js/views/Dashboard.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Leaderboard from './static/js/views/Leaderboard.js';

const navigateTo = (url: string) => {
  history.pushState(null, '', url);
  void router();
};

const router = async () => {
  const routes = [
    {path: '/', view: Dashboard},
    {path: '/login', view: Login},
    {path: '/register', view: Register},
    {path: '/leaderboard', view: Leaderboard},
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
    const view = new match.route.view();
    const appElement = document.querySelector('#app');

    if (appElement) {
      // Actually update the HTML with the view's content
      const html = await view.getHtml();
      appElement.innerHTML = html;
    } else {
      console.error('Could not find #app element');
    }
  } catch (error) {
    console.error('Error rendering view:', error);
  }
};

window.addEventListener('popstate', router);

// window.addEventListener('load', () => {
//   alert('TESTE');
// });

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

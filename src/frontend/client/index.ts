import Home from './static/js/views/Home.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Game from './static/js/views/Game.js';
import NotFound from './static/js/views/404.js';


const navigateTo = (url: string) => {
  history.pushState(null, '', url);
  void router();
};

const router = async () => {
  const routes = [
    {path: '/404,', view: NotFound},
    {path: '/', view: Home},
    {path: '/Home', view: Home},
    {path: '/login', view: Login},
    {path: '/register', view: Register},
    {path: '/game', view: Game},
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
      if (match.route.path === '/login' || match.route.path === '/register') {
        await view.onMount();
      } 
      else if (match.route.path === '/game') {
        await view.renderGame();
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

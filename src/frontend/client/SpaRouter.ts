import Home from './static/js/views/Home.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Game from './static/js/views/Game.js';
import NotFound from './static/js/views/404.js';
import GameMenu from './static/js/views/GameMenu.js';
import PlayerSelection from './static/js/views/PlayerSelection.js';
import Tournament from './static/js/views/Tournament.js';
import TiamaPong from './game/entities/TiamaPong.js';
import { updateHeaderUserLink } from './static/js/views/Login.js';

export default class SpaRouter {
  public gameContext: TiamaPong;

  constructor(gameContext: TiamaPong) {
    this.gameContext = gameContext;
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('popstate', this.router);

    document.addEventListener('DOMContentLoaded', () => {
      document.body.addEventListener('click', (e: MouseEvent) => {
        if (
          e.target instanceof HTMLAnchorElement &&
          e.target.matches('[data-link]')
        ) {
          e.preventDefault();
          this.navigateTo(e.target.href);
        }
      });
      void this.router();
      if (
        typeof window !== "undefined" &&
        typeof document !== "undefined"
      ) {
        this.autoLogoutOnJwtExpiry();
      }
    });
  }

  getJwtExpiration(token: string | null): number | null {
    if (!token) return null;
    try {
      const [, payloadB64] = token.split('.');
      const payload = JSON.parse(atob(payloadB64));
      return payload.exp ? payload.exp : null;
    } catch {
      return null;
    }
  }

  isJwtValid(token: string | null): boolean {
    const exp = this.getJwtExpiration(token);
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp > now;
  }

  autoLogoutOnJwtExpiry() {
    setInterval(() => {
      const jwt = localStorage.getItem('jwt');
      if (jwt && !this.isJwtValid(jwt)) {
        localStorage.removeItem('jwt');
        localStorage.removeItem('google_jwt');

        updateHeaderUserLink(false); // <-- update header to "Log In"

        // Redirect to login page (SPA navigation)
        if (window.location.pathname !== '/login') {
          history.pushState({}, '', '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
        // Optionally, show a message only once
        if (!window.sessionStorage.getItem('jwt_expired_alerted')) {
          alert('Session expired. Please log in again.');
          window.sessionStorage.setItem('jwt_expired_alerted', '1');
        }
      } else if (jwt && this.isJwtValid(jwt)) {
        // Reset alert flag if user logs in again
        window.sessionStorage.removeItem('jwt_expired_alerted');
      }
    }, 1000); // check every second
  }

  navigateTo = (url: string) => {
    history.pushState(null, '', url);
    void this.router();
  };

  router = async () => {
    const routes = [
      { path: '/404,', view: NotFound },
      { path: '/', view: Home },
      { path: '/Home', view: Home },
      { path: '/login', view: Login },
      { path: '/register', view: Register },
      { path: '/game', view: Game },
      { path: '/game-menu', view: GameMenu },
      { path: '/tournament-player-selection', view: PlayerSelection },
      { path: '/tournament', view: Tournament },
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
      const appElement = document.querySelector('#app') as HTMLElement;

      if (appElement) {
        const html = await view.getHtml();

        //validate phase
        if (match.route.path === '/tournament' && !(await view.beforeMount(this.gameContext))) {
          return false;
        }

        //render the view page
        appElement.innerHTML = html;

        //after html view rendered
        if (match.route.path === '/login' || match.route.path === '/register') {
          await view.onMount();
        }
        else if (match.route.path === '/game-menu') {
          await view.onMount(this.gameContext);
        }
        else if (match.route.path === '/tournament') {
          await view.onMount(this.gameContext, appElement);
        }
        else if (match.route.path === '/tournament-player-selection') {
          await view.onMount(this.gameContext);
        }
      } else {
        console.error('Could not find #app element');
      }
    } catch (error) {
      console.error('Error rendering view:', error);
    }
  };
}

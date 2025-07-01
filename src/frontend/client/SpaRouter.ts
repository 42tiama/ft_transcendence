import Home from './static/js/views/Home.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Versus from './static/js/views/Versus.js';
import NotFound from './static/js/views/404.js';
import AbstractView from './static/js/views/AbstractView.js';
import GameMenu from './static/js/views/GameMenu.js';
import PlayerSelection from './static/js/views/tournamentPlayerSelection.js';
import VersusPlayerSelection from './static/js/views/versusPlayerSelection.js';
import Tournament from './static/js/views/Tournament.js';
import TiamaPong from './game/entities/TiamaPong.js';
import ChangePass from './static/js/views/ChangePass.js'; // to change the password
import GameAi from './static/js/views/GameAi.js'; // to play the game against AI
import Profile from './static/js/views/Profile.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class SpaRouter {
  public gameContext: TiamaPong;
  private currentView: AbstractView | null = null;
  private stopHeartbeats?: () => void;

  constructor(gameContext: TiamaPong) {
    this.gameContext = gameContext;
    this.initListeners();
  }

  initListeners() {
    window.addEventListener('popstate', () => {
      this.router();
      this.hideLinksIfNotLoggedIn();
    });

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
      // On first load, if not logged in and not already at /login or /register, redirect to /login
      const jwt = localStorage.getItem('jwt');
      if (!this.isJwtValid(jwt) && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        history.replaceState({}, '', '/login');
      }
      void this.router();
      this.hideLinksIfNotLoggedIn();
      if (typeof window !== "undefined" && typeof document !== "undefined") {
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
        localStorage.removeItem('userId');

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
        // Hide links when logged out
        this.hideLinksIfNotLoggedIn();
      } else if (jwt && this.isJwtValid(jwt)) {
        // Reset alert flag if user logs in again
        window.sessionStorage.removeItem('jwt_expired_alerted');
        // Show links when logged in
        this.hideLinksIfNotLoggedIn();
      }
    }, 1000); // check every second
  }

  // Call the send heartbeat function in a set interval (default 5 sec)
  startHeartbeats(intervalMs = 5000) {
    const sendHeartbeat = () => {
      const userId = localStorage.getItem('userId');
      if(userId) {
        fetch(`${API_BASE}/heartbeat/${userId}`, {
        	method: 'POST'
        }).catch(err => {
          console.error('Failed to send heartbeat:', err);
        });
      }
    };
    // Send one immediately
    sendHeartbeat();
    // Set interval to send repeatedly
    const intervalId = window.setInterval(sendHeartbeat, intervalMs);
    // Return a function that stops the interval
    return () => clearInterval(intervalId);
  }

  hideLinksIfNotLoggedIn() {
    const jwt = localStorage.getItem('jwt');
    const isLoggedIn = this.isJwtValid(jwt);
    const navLinks = document.querySelectorAll('header nav a');
    navLinks.forEach(link => {
      if (link instanceof HTMLElement) {
        const text = link.textContent?.trim().toLowerCase();
        if (["home", "leaderboard", "game", "vs ai"].includes(text || "")) {
          link.style.display = isLoggedIn ? "flex" : "none";
        }
      }
    });
  }

  // updates the header when loggedIn (true = User || false = Log In)
  updateHeaderUserLink(isLoggedIn: boolean) {
  	const loginLink = document.querySelector('a[href="/login"]');
  	const profileLink = document.querySelector('a[href="/profile"]');

  	if (isLoggedIn) {
  		if (loginLink) loginLink.classList.add('hidden');
  		if (profileLink) profileLink.classList.remove('hidden');
  	} else {
  		if (loginLink) loginLink.classList.remove('hidden');
  		if (profileLink) profileLink.classList.add('hidden');
  	}
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
      { path: '/versus', view: Versus },
      { path: '/game-ai', view: GameAi },
      { path: '/changepass', view: ChangePass },
      { path: '/game-menu', view: GameMenu },
      { path: '/tournament-player-selection', view: PlayerSelection },
      { path: '/versus-player-selection', view: VersusPlayerSelection },
      { path: '/tournament', view: Tournament },
      { path: '/profile', view: Profile},
    ];

    const protectedRoutes = [
      '/', '/Home', '/game', '/game-menu', '/profile', '/changepass', '/game-ai'
    ];

    const jwt = localStorage.getItem('jwt');
    const isLoggedIn = this.isJwtValid(jwt);

    //update header to either "Log In" or "User"
    this.updateHeaderUserLink(isLoggedIn);

    // If not logged in and trying to visit a protected route, redirect to /login
    if (!isLoggedIn && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      history.replaceState({}, '', '/login');
    }

    if (!isLoggedIn) { // Stop heartbeats if user is not logged in and clears the reference so it can restart later
      this.stopHeartbeats?.();
      this.stopHeartbeats = undefined;
    } else if (!this.stopHeartbeats) { // Restart heartbeat when user relogs (is logged in and not already running)
      this.stopHeartbeats = this.startHeartbeats();
    }

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

      //validate phase
      if (match.route.path === '/tournament' && !(await view.beforeMount(this.gameContext))) {
        return false;
      }
      else if (match.route.path === '/versus' && !(await view.beforeMount(this.gameContext))) {
        return false;
      }

      if (this.currentView && typeof this.currentView.onUnMount === 'function') {
        this.currentView.onUnMount();
      }

      this.currentView = view;
      const appElement = document.querySelector('#app') as HTMLElement;

      if (appElement) {
        const html = await view.getHtml();

        //render the view page
        appElement.innerHTML = html;

        //after html view rendered
        if (match.route.path === '/login' || match.route.path === '/register'
          || match.route.path === '/changepass' || match.route.path === '/profile') {
          await view.onMount(this.gameContext);
        }
        else if (match.route.path === '/game-menu') {
          await view.onMount(this.gameContext);
        }
        else if (match.route.path === '/game-ai') {
          await view.onMount(this.gameContext);
        }
        else if (match.route.path === '/tournament') {
          await view.onMount(this.gameContext, appElement);
        }
        else if (match.route.path === '/versus') {
          await view.onMount(this.gameContext);
        }
        else if (match.route.path === '/versus-player-selection') {
          await view.onMount(this.gameContext);
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

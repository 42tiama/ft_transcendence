
import Home from './static/js/views/Home.js';
import Login from './static/js/views/Login.js';
import Register from './static/js/views/Register.js';
import Game from './static/js/views/Game.js';
// import NotFound from './static/js/views/404.js';
import GameMenu from './static/js/views/GameMenu.js';
import ChangePass from './static/js/views/ChangePass.js'; // to change the password
import Profile from './static/js/views/Profile.js'; // to check the JWT

import { updateHeaderUserLink } from './static/js/views/Login.js';

function getJwtExpiration(token: string | null): number | null {
	if (!token) return null;
	try {
		const [, payloadB64] = token.split('.');
		const payload = JSON.parse(atob(payloadB64));
		return payload.exp ? payload.exp : null;
	} catch {
		return null;
	}
}

function isJwtValid(token: string | null): boolean {
	const exp = getJwtExpiration(token);
	if (!exp) return false;
	const now = Math.floor(Date.now() / 1000);
	return exp > now;
}

function autoLogoutOnJwtExpiry() {
	setInterval(() => {
		const jwt = localStorage.getItem('jwt');
		if (jwt && !isJwtValid(jwt)) {
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
			// Hide links when logged out
			hideLinksIfNotLoggedIn();
		} else if (jwt && isJwtValid(jwt)) {
			// Reset alert flag if user logs in again
			window.sessionStorage.removeItem('jwt_expired_alerted');
			// Show links when logged in
			hideLinksIfNotLoggedIn();
		}
	}, 1000); // check every second
}

function hideLinksIfNotLoggedIn() {
	const jwt = localStorage.getItem('jwt');
	const isLoggedIn = isJwtValid(jwt);
	const navLinks = document.querySelectorAll('header nav a');
	navLinks.forEach(link => {
		if (link instanceof HTMLElement) {
			const text = link.textContent?.trim().toLowerCase();
			if (["home", "leaderboard", "game"].includes(text || "")) {
				link.style.display = isLoggedIn ? "" : "none";
			}
		}
	});
}

const navigateTo = (url: string) => {
	history.pushState(null, '', url);
	void router();
};

const router = async () => {
	const routes = [
    	// {path: '/404,', view: NotFound},
		{path: '/', view: Home},
		{path: '/Home', view: Home},
		{path: '/login', view: Login},
		{path: '/register', view: Register},
		{path: '/game', view: Game},
		{path: '/changepass', view: ChangePass},
		{path: '/profile', view: Profile},
		{path: '/game-menu', view: GameMenu},
	];

	const protectedRoutes = [
		'/', '/Home', '/game', '/game-menu', '/profile', '/changepass'
	];

	const jwt = localStorage.getItem('jwt');
	const isLoggedIn = isJwtValid(jwt);

	// If not logged in and trying to visit a protected route, redirect to /login
	if (!isLoggedIn && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
		history.replaceState({}, '', '/login');
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
      		else if (match.route.path === '/game') {
        		await view.renderGame();
      		}
      		else if (match.route.path === '/game-menu') {
        		view.onMount();
			}
		} else {
			console.error('Could not find #app element');
		}
	} catch (error) {
		console.error('Error rendering view:', error);
	}

	hideLinksIfNotLoggedIn();
};

window.addEventListener('popstate', () => {
	router();
	hideLinksIfNotLoggedIn();
});

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
	// On first load, if not logged in and not already at /login or /register, redirect to /login
	const jwt = localStorage.getItem('jwt');
	if (!isJwtValid(jwt) && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
		history.replaceState({}, '', '/login');
	}
	void router();
	hideLinksIfNotLoggedIn();
	if (typeof window !== "undefined" && typeof document !== "undefined") {
		autoLogoutOnJwtExpiry();
	}
});
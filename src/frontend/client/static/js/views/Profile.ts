import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class Profile extends AbstractView {
	constructor() {
	    super();
	    this.setTitle('Profile');
	}

	async getHtml(): Promise<string> {
		try {
			const response = await fetch('build/static/html/profile.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.text();
		} catch (error) {
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading Profile</h1>';
		}
	}

	async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
		const existingJwt = localStorage.getItem('jwt');

		// extract userId, JWT and time remaining from payload (assume standard claims)
		const payload = parseJwt(existingJwt);
		const userId = payload?.id;
		const timeRemaining = getJwtTimeRemaining(existingJwt);
		console.log(payload);

		// Format JWT for 4-line display
		const formattedJwt = formatJwtForDisplay(existingJwt);

		// Fetch user profile from database
		let userProfile = null;
		if (userId) {
			userProfile = await getUserProfile(userId);
		}
		const name = userProfile?.name || payload?.preferred_username || 'N/A';
		const displayName = userProfile?.display_name || name;
		const email = userProfile?.email || 'N/A';

		// add event listener for change password
		const changepassBtn = document.getElementById('changepass-btn');
		if (changepassBtn) {
			changepassBtn.addEventListener('click', () => {
				// SPA navigation - you may need to trigger your router here
				window.history.pushState({}, '', '/changepass');
				// If you have a SPA router, trigger it to load the view
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
		}

		// add event listener for logout
		const logoutBtn = document.getElementById('logout-btn');
		if (logoutBtn) {
			logoutBtn.addEventListener('click', () => {
				localStorage.removeItem('jwt');
				localStorage.removeItem('google_jwt');
				// === SPA Navigation to /login ===
				window.history.pushState({}, '', '/login');
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
		}

		// live update the JWT expiration countdown
		const expiresSpan = document.getElementById('jwt-expires');
		if (expiresSpan && payload?.exp) {
			const interval = setInterval(() => {
				const time = getJwtTimeRemaining(existingJwt);
				expiresSpan.textContent = time;
				if (time === "Expired") clearInterval(interval);
			}, 1000);
		}
		return;
	}

	async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
 	   return;
	}

}

// parses JWT and returns its payload or null
function parseJwt(token: string | null): any | null {
	if (!token) return null;
	try {
		const [, payloadB64] = token.split('.');
		return JSON.parse(atob(payloadB64));
	} catch {
		return null;
	}
}

// returns time remaining (as string) until JWT expiration
function getJwtTimeRemaining(token: string | null): string {
	const payload = parseJwt(token);
	if (!payload || !payload.exp) return "N/A";
	const now = Math.floor(Date.now() / 1000);
	const remainingSec = payload.exp - now;
	if (remainingSec <= 0) return "Expired";
	const min = Math.floor(remainingSec / 60);
	const sec = remainingSec % 60;
	return `${min}m ${sec}s`;
}

// breaks a long JWT string into 4 lines
function formatJwtForDisplay(jwt: string | null): string {
	if (!jwt) return "";
	const partLength = Math.ceil(jwt.length / 4);
	const lines = [];
	for (let i = 0; i < 4; i++) {
		lines.push(jwt.slice(i * partLength, (i + 1) * partLength));
	}
	return lines.join('\n');
}

// fetches user profile data from profile service
async function getUserProfile(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/profile/user/${userId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}
import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

// set the API base URL to the API gateway for all authentication requests
const API_BASE = 'https://localhost:8044';

// check if login JWT is valid
function isJwtValid(token: string | null): boolean {
	if (!token) return false;
	try {
		const [, payloadB64] = token.split('.');
		const payload = JSON.parse(atob(payloadB64));
		if (!payload || !payload.exp) return false;
		// JWT expiry is in seconds since epoch
		const now = Math.floor(Date.now() / 1000);
		return payload.exp > now;
	} catch {
		return false;
	}
}

// parse JWT and return its payload or null
// iury: exporting to use on other places
export function parseJwt(token: string | null): any | null {
	if (!token) return null;
	try {
		const [, payloadB64] = token.split('.');
		return JSON.parse(atob(payloadB64));
	} catch {
		return null;
	}
}

// return time remaining (as string) until JWT expiration
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

// break a long JWT string into 4 lines
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

// update the header after login (true = User || false = Log In)
export function updateHeaderUserLink(isLoggedIn: boolean) {
	const navLinks = document.querySelectorAll('header nav a');
	navLinks.forEach(link => {
		// if logged in, change "Log In" → "User"
		if (isLoggedIn && link.textContent?.trim().toLowerCase() === "log in") {
			link.textContent = "User";
		}
		// if logged out, change "User" → "Log In"
		else if (!isLoggedIn && link.textContent?.trim().toLowerCase() === "user") {
			link.textContent = "Log In";
		}
	});
}

// handle sign-in with Google
async function handleGoogleCredential(response: any) {

	// prevents login if already logged in
	const existingJwt = localStorage.getItem('jwt');
	if (isJwtValid(existingJwt)) {
		alert('You are already logged in. Please log out first to switch accounts.');
		return;
	}

	// receives the Google credential (JWT) from the Google sign-in button
	const credential = response.credential; // The JWT

	// store the Google ID token in localStorage for later inspection
	localStorage.setItem('google_jwt', credential);

	try {
		// send Google credential (JWT) to the backend at /google-login (via API gateway).
		const res = await fetch(`${API_BASE}/google-login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ credential }),
		});
		const data = await res.json();

		if (res.ok) {
			// on success: store app’s JWT in localStorage and show a success alert
			localStorage.setItem('jwt', data.token);
			alert('Google login successful!');
			updateHeaderUserLink(true);
			// SPA navigation to /home
        	window.history.pushState({}, '', '/');
        	window.dispatchEvent(new PopStateEvent('popstate'));
		} else {
			alert(data.error || 'Google login failed.');
		}
	} catch (err) {
		alert('Connection error.');
	}
}

// this make Login a view that can be loaded by SPA router
export default class Login extends AbstractView {
	constructor() {
		super();
		// set the page title to "Login" when the view is constructed.
		this.setTitle('Login');
	}

	async getHtml(): Promise<string> {
		try {
			// fetch the HTML template from build/static/html/login.html
			const response = await fetch('build/static/html/login.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// return the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handle errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading login</h1>';
		}
	}

	async onMount() {

	const existingJwt = localStorage.getItem('jwt');
	const appDiv = document.getElementById('app');

		if (isJwtValid(existingJwt)) {

			// try to find the header element that says "Login" and change it
			const navLinks = document.querySelectorAll('header nav a');
			navLinks.forEach(link => {
				// compare link text ignoring case and whitespace
				if (link.textContent?.trim().toLowerCase() === "log in") {
					link.textContent = "User";
				}
			});

			// hide login form and Google button
			const loginForm = document.getElementById('login-form');
			const googleBtn = document.getElementById('google-signin-button');
			if (loginForm) loginForm.style.display = 'none';
			if (googleBtn) googleBtn.style.display = 'none';

			// extract email, display name and JWT and time remaining from payload (assume standard claims)
			const payload = parseJwt(existingJwt);
			const timeRemaining = getJwtTimeRemaining(existingJwt);
			const email = payload?.email || 'N/A';
			const name = payload?.name || payload?.displayName || payload?.preferred_username || 'N/A';
			const userId = payload?.id;
			console.log('JWT payload:', payload);

			// Fetch user profile from database
			let userProfile = null;
			if (userId) {
				userProfile = await getUserProfile(userId);
			}

			// Use display name from database if available, otherwise fall back to JWT
			const displayName = userProfile?.display_name || name;
			console.log('Final display name:', displayName);

			// format JWT for 4-line display
			const formattedJwt = formatJwtForDisplay(existingJwt);

			// renders user profile
			if (appDiv) {
				appDiv.innerHTML = `
				<div class="text-white min-h-screen p-6 bg-[#2c2f33]">
				  <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

				    <!-- 🟦 LEFT COLUMN -->
				    <div class="lg:col-span-2 space-y-6">

				      <!-- Profile -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6">
				        <h2 class="text-2xl font-bold mb-4">My Profile</h2>
				        <div class="flex flex-col md:flex-row gap-6 items-center">
				          <div class="flex flex-col items-center bg-gray-700 p-4 rounded-lg">
				            <img id="avatar-preview" src="/images/default-avatar.png" alt="Avatar"
				              class="w-24 h-24 rounded-full mb-2 border-2 border-white object-cover shadow-lg" />
				            <input type="file" id="avatar-upload" accept="image/*"
				              class="text-sm text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
				          </div>
				          <form id="update-profile-form" class="flex-1 space-y-3 w-full">
				            <div>
				              <label class="block text-sm mb-1">Display Name</label>
				              <input id="display-name-input" type="text" value="${displayName}"
				                class="w-full p-2 rounded border border-gray-400 bg-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400" />
				            </div>
				            <div>
				              <label class="block text-sm mb-1">Card Color</label>
				              <input id="card-color-input" type="color"
				                class="w-16 h-10 p-1 border border-gray-400 rounded bg-white" />
				            </div>
				            <button type="submit"
				              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4 transition">
				              Update Profile
				            </button>
				          </form>
				        </div>
				      </section>

				      <!-- Stats -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6">
				        <h2 class="text-2xl font-bold mb-4">Stats</h2>
				        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
				          <div><p class="text-lg font-semibold">Wins</p><p id="wins-count" class="text-amber-400 text-xl">0</p></div>
				          <div><p class="text-lg font-semibold">Losses</p><p id="losses-count" class="text-amber-400 text-xl">0</p></div>
				          <div><p class="text-lg font-semibold">Win Rate</p><p id="win-rate" class="text-amber-400 text-xl">0%</p></div>
				          <div><p class="text-lg font-semibold">Total Matches</p><p id="total-matches" class="text-amber-400 text-xl">0</p></div>
				        </div>
				      </section>

				      <!-- Match History -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6">
				        <h2 class="text-2xl font-bold mb-4">Match History</h2>
				        <table class="w-full table-auto text-sm">
				          <thead>
				            <tr class="border-b border-gray-600">
				              <th class="py-2 text-left">Date</th>
				              <th class="py-2 text-left">Opponent</th>
				              <th class="py-2 text-left">Result</th>
				              <th class="py-2 text-left">Score</th>
				            </tr>
				          </thead>
				          <tbody id="match-history-table">
				            <!-- Filled by JS -->
				          </tbody>
				        </table>
				      </section>

				      <!-- Session Info -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6">
				        <h2 class="text-2xl font-bold mb-4">Session Info</h2>
				        <div class="overflow-x-auto text-white text-sm space-y-2">
				          <div>
				            <strong class="text-gray-300">JWT:</strong>
				            <pre class="bg-gray-900 p-3 rounded text-xs text-green-400 break-all whitespace-pre-wrap">${formattedJwt}</pre>
				          </div>
				          <div><strong class="text-gray-300">Expires in:</strong> <span id="jwt-expires" class="text-white">${timeRemaining}</span></div>
				          <div><strong class="text-gray-300">Email:</strong> <span id="jwt-email" class="text-white">${email}</span></div>
				          <div><strong class="text-gray-300">Display Name:</strong> <span id="jwt-name" class="text-white">${name}</span></div>
				        </div>
				      </section>

				      <!-- Account Actions -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6">
				        <h2 class="text-2xl font-bold mb-4">Account Actions</h2>
				        <div class="flex gap-4">
				          <button id="changepass-btn" type="button"
				            class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition">
				            Change Password
				          </button>
				          <button id="logout-btn" type="button"
				            class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition">
				            Log Out
				          </button>
				        </div>
				      </section>

				    </div>

				    <!-- 🟩 RIGHT COLUMN -->
				    <div class="space-y-6">

				      <!-- Friends Section -->
				      <section class="bg-[#23272a] rounded-lg shadow p-6 h-full flex flex-col">
				        <h2 class="text-2xl font-bold mb-4">Friends</h2>

				        <!-- Add friend -->
				        <div class="mb-4 flex gap-2">
				          <input id="friend-email" type="email" placeholder="Friend's email"
				            class="flex-1 p-2 rounded border border-gray-400 bg-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400" />
				          <button id="add-friend-btn"
				            class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition">
				            Add
				          </button>
				        </div>
				        <p id="add-friend-message" class="text-sm mb-4 text-green-400"></p>

				        <!-- Friends list -->
				        <div class="flex-1 overflow-y-auto">
				          <ul id="friends-list" class="space-y-2">
				            <!-- Filled by JS -->
				          </ul>
				        </div>
				      </section>

				    </div>
				  </div>
				</div>
				`;

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
					updateHeaderUserLink(false);
					window.location.reload();
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
			}
			return;
		}

		// add 2FA toggle if not present in the HTML template
		let twofaToggle = document.getElementById('use2fa-login') as HTMLInputElement | null;
		if (!twofaToggle) {
			const totpDiv = document.getElementById('totp')?.parentElement;
			const toggleDiv = document.createElement('div');
			toggleDiv.innerHTML = `
				<label>
					<input type="checkbox" id="use2fa-login" checked />
					I am using 2FA for this account
				</label>
			`;
			if (totpDiv && totpDiv.parentElement) {
				totpDiv.parentElement.insertBefore(toggleDiv, totpDiv);
			}
			twofaToggle = document.getElementById('use2fa-login') as HTMLInputElement | null;
		}

		// hide/show TOTP input based on toggle
		const totpField = document.getElementById('totp') as HTMLInputElement | null;
		if (twofaToggle && totpField) {
			const toggleTOTPVisibility = () => {
				totpField.parentElement!.style.display = twofaToggle.checked ? '' : 'none';
			};
			twofaToggle.addEventListener('change', toggleTOTPVisibility);
			toggleTOTPVisibility();
		}

		// find the password field and toggle button
		const pwd = document.getElementById('password') as HTMLInputElement | null;
		const toggle = document.getElementById('togglePassword') as HTMLButtonElement | null;
		if (pwd && toggle) {
			toggle.addEventListener('click', (e) => {
				console.log("Toggle password button clicked!");
				e.preventDefault();
				const isVisible = pwd.type === 'text';
				pwd.type = isVisible ? 'password' : 'text';
				// clicking the toggle shows/hides the password and changes the button icon (👁️/🙈).
				toggle.textContent = isVisible ? '👁️' : '🙈';
				console.log("Password field type is now:", pwd.type);
			});
		} else {
			console.log("Password field or toggle button not found in DOM.");
		}

		// find the login form with ID login-form
		const form = document.getElementById('login-form') as HTMLFormElement | null;
		if (form) {

			// adds a submit event listener
			form.addEventListener('submit', async (e) => {

				// prevents default form submission
				e.preventDefault();

				// prevents new login if already logged in
				const existingJwt = localStorage.getItem('jwt');
				if (isJwtValid(existingJwt)) {
					alert('You are already logged in. Please log out first to switch accounts.');
					e.preventDefault();
					return;
				}

				// grabs input values for email, TOTP code, and new password
				const emailInput = document.getElementById('email') as HTMLInputElement;
				const passwordInput = document.getElementById('password') as HTMLInputElement;
				const totpInput = document.getElementById('totp') as HTMLInputElement;
				const use2fa = twofaToggle ? twofaToggle.checked : true;

				const email = emailInput?.value;
				const password = passwordInput?.value;
				const totp = totpInput?.value;

				// validate all fields are filled
				if (!email || !password || (use2fa && !totp)) {
					alert(use2fa
						? 'Please enter email, password and TOTP code.'
						: 'Please enter email and password.');
					return;
				}

				// build the request body
				const body: any = { email, password };
				if (use2fa) body.totp = totp;

				// send a POST request to https://localhost:8044/login with the form data as JSON.
				try {
					const response = await fetch(`${API_BASE}/login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(body),
					});
					const data = await response.json();

					// on error: show alert with error message
					if (!response.ok) {
						if (data && data.error) {
							alert(data.error);
						} else {
							alert('Unknown error occurred.');
						}
						return;
					}

					// on success: store the JWT in localStorage and alerts success
					if (data.token) {
						localStorage.setItem('jwt', data.token);
						localStorage.removeItem('google_jwt'); // invalidate previous Google ID token
						updateHeaderUserLink(true);
					}

					alert('Login successful!');

					// clear fields after success
					emailInput.value = '';
					passwordInput.value = '';
					if (totpInput) totpInput.value = '';

					// redirect to /home using SPA navigation
					window.history.pushState({}, '', '/');
					window.dispatchEvent(new PopStateEvent('popstate'));

				} catch (err) {
					// catch and log any unexpected errors
					alert('Error connecting to server.');
				}
			});
		}

		// ensure Google API is loaded before initializing
		if (!window.google) {
			// waits until the Google API is loaded.
			await new Promise((resolve) => {
				const checkInterval = setInterval(() => {
					if (window.google) {
						clearInterval(checkInterval);
						resolve(true);
					}
				}, 100);
			});
		}

		// initialize the Google sign-in widget with appropriate client ID and callback (handleGoogleCredential).
		window.google.accounts.id.initialize({
			client_id: "445999956724-9nbpuf3kfd38j2hrji5sl86aajcrsaou.apps.googleusercontent.com",
			callback: handleGoogleCredential,
			context: "signin",
			ux_mode: "popup",
			login_uri: "http://localhost:8042/",
		});

		// render the Google sign-in button in the DOM element with ID google-signin-button.
		window.google.accounts.id.renderButton(
			document.getElementById("google-signin-button")!,
			{
				type: "standard",
				theme: "filled_black",
				size: "large",
				text: "continue_with",
				shape: "rectangular",
				logo_alignment: "left",
			}
		);
	}

	async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
		return true;
	}
}

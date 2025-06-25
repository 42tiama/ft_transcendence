
import AbstractView from './AbstractView.js';

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
function parseJwt(token: string | null): any | null {
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
	
	// prevent login if already logged in
	const existingJwt = localStorage.getItem('jwt');
	if (isJwtValid(existingJwt)) {
		alert('You are already logged in. Please log out first to switch accounts.');
		return;
	}
	
	// receive the Google credential (JWT) from the Google sign-in button
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
        	window.history.pushState({}, '', '/home');
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

			// format JWT for 4-line display
			const formattedJwt = formatJwtForDisplay(existingJwt);

			// render logout and change password button
			if (appDiv) {		
				appDiv.innerHTML = `
					<div class="flex flex-col items-center py-6">
						<p style="margin-top: 38px;" class="text-white mb-0">You are already logged in.</p>
						<button id="changepass-btn"
							class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-8 rounded transition"
							style="margin-top: 38px;">
							Change Profile
						</button>
						<button id="logout-btn"
							class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-8 rounded transition"
							style="margin-top: 38px;">
							Log Out
						</button>
						<div class="bg-white rounded p-4 mt-10 w-full max-w-xl" style="margin-top: 38px;">
							<h2 class="text-lg font-semibold mb-2 text-black">Session Info</h2>
							<div class="overflow-x-auto text-black text-sm mb-2">
								<strong>JWT:</strong>
								<pre class="bg-gray-200 p-1 rounded text-xs break-all mb-1" style="white-space: pre-line; min-width: 200px;">${formattedJwt}</pre>
								<strong>Expires in:</strong> <span id="jwt-expires">${timeRemaining}</span><br>
								<strong>Email:</strong> <span id="jwt-email">${email}</span><br>
								<strong>Display Name:</strong> <span id="jwt-name">${name}</span>
							</div>
						</div>
					</div>
				`;

				// add event listener for change password
				const changepassBtn = document.getElementById('changepass-btn');
				if (changepassBtn) {
					changepassBtn.addEventListener('click', () => {
						// SPA navigation to /changepass
						window.history.pushState({}, '', '/changepass');
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
		
			// add a submit event listener
			form.addEventListener('submit', async (e) => {
			
				// prevent default form submission
				e.preventDefault();
			
				// prevent new login if already logged in
				const existingJwt = localStorage.getItem('jwt');
				if (isJwtValid(existingJwt)) {
					alert('You are already logged in. Please log out first to switch accounts.');
					e.preventDefault();
					return;
				}
			
				// grab input values for email, TOTP code, and new password
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
					window.history.pushState({}, '', '/home');
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
			document.getElementById("google-signin-button"),
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
}
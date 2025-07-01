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
export function parseJwt(token: string | null): any | null {
	if (!token) return null;
	try {
		const [, payloadB64] = token.split('.');
		return JSON.parse(atob(payloadB64));
	} catch {
		return null;
	}
}

// handles sign-in with Google
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

	async onMount(gameContext: TiamaPong | null, appElement: Element | null) {

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
						localStorage.removeItem('google_jwt'); // Invalidate previous Google ID token
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

	async onUnMount() {
  	}
}

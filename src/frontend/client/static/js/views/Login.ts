import AbstractView from './AbstractView.js';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

// handles sign-in with Google
async function handleGoogleCredential(response: any) {
	// receives the Google credential (JWT) from the Google sign-in button
	const credential = response.credential; // The JWT

	// stores the Google ID token in localStorage for later inspection
	localStorage.setItem('google_jwt', credential);

	try {
		// sends Google credential (JWT) to the backend at /google-login (via API gateway).
		const res = await fetch(`${API_BASE}/google-login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ credential }),
		});
		const data = await res.json();

		if (res.ok) {
			// on success: stores your app’s JWT in localStorage and shows a success alert
			localStorage.setItem('jwt', data.token);
			alert('Google login successful!');
			// on failure: alerts the user
		} else {
			alert(data.error || 'Google login failed.');
		}
	} catch (err) {
		alert('Connection error.');
	}
}

// this makes Login a view that can be loaded by SPA router
export default class Login extends AbstractView {
	constructor() {
		super();
		// sets the page title to "Login" when the view is constructed.
		this.setTitle('Login');
	}

	async getHtml(): Promise<string> {
		try {
			// fetches the HTML template from build/static/html/login.html
			const response = await fetch('build/static/html/login.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// returns the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handles errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading login</h1>';
		}
	}

	async onMount() {
		// Finds the password field and toggle button
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


		// finds the login form with ID login-form
		const form = document.getElementById('login-form') as HTMLFormElement | null;
		if (form) {
			// adds a submit event listener
			form.addEventListener('submit', async (e) => {
				// prevents default form submission
				e.preventDefault();

				// grabs input values for email, TOTP code, and new password
				const emailInput = document.getElementById('email') as HTMLInputElement;
				const passwordInput = document.getElementById('password') as HTMLInputElement;
				const totpInput = document.getElementById('totp') as HTMLInputElement;

				const email = emailInput?.value;
				const password = passwordInput?.value;
				const totp = totpInput?.value;

				// validates all fields are filled
				if (!email || !password || !totp) {
					alert('Please enter email, password and TOTP code.');
					return;
				}

				// sends a POST request to /login on the API gateway with the credentials
				try {
					const response = await fetch(`${API_BASE}/login`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, password, totp }),
					});
					const data = await response.json();

					// on error: shows alert with error message
					if (!response.ok) {
						if (data && data.error) {
							alert(data.error);
						} else {
							alert('Unknown error occurred.');
						}
						return;
					}

					// on success: stores the JWT in localStorage and alerts success
					if (data.token) {
						localStorage.setItem('jwt', data.token);
						localStorage.removeItem('google_jwt'); // Invalidate previous Google ID token
					}

					alert('Login successful!');

					// clears fields after success
					emailInput.value = '';
					passwordInput.value = '';
					totpInput.value = '';

					// ====> TODO: after login redirect to HOME

				} catch (err) {
					// catches and logs any unexpected errors
					alert('Error connecting to server.');
				}
			});
		}

		// ensures Google API is loaded before initializing
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

		// initializes the Google sign-in widget with appropriate client ID and callback (handleGoogleCredential).
		window.google.accounts.id.initialize({
			client_id: "445999956724-9nbpuf3kfd38j2hrji5sl86aajcrsaou.apps.googleusercontent.com",
			callback: handleGoogleCredential,
			context: "signin",
			ux_mode: "popup",
			login_uri: "http://localhost:8042/",
		});

		// renders the Google sign-in button in the DOM element with ID google-signin-button.
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
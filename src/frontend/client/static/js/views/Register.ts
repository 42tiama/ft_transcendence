import TiamaPong from 'game/entities/TiamaPong.js';
import AbstractView from './AbstractView.js';

// function to validate email
function isValidEmail(email: string): boolean {
	// const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
	const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+\.[a-z]{2,}$/;
	if (!email || email.length > 320) return false;
	const [local, domain] = email.split('@');
	if (!local || !domain || local.length > 64 || domain.length > 255) return false;
	return emailRegex.test(email);
}

// function to validate password
function isValidPassword(password: string): boolean {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}


// function to validate display name (max 9 chars)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 9;
}


// this makes Register a view that can be loaded by SPA router
export default class Register extends AbstractView {

	constructor() {
		super();
		// sets the page title to "Register" when the view is constructed.
		this.setTitle('Register');
	}

	async getHtml(): Promise<string> {
		try {
			// fetches the HTML template from build/static/html/register.html
			const response = await fetch('build/static/html/register.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// returns the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handles errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading register</h1>';
		}
	}

	async onMount(gameContext: TiamaPong | null, appElement: Element | null): Promise<void> {
		// finds the registration form in the DOM.
		const form = document.querySelector('form');
		if (!form) {
			console.error("Register form not found.");
			return;
		}
		// binds the submit event to submitRegistration.
		form.addEventListener('submit', this.submitRegistration.bind(this));
	}

	private async submitRegistration(e: Event): Promise<any> {
		e.preventDefault();

		// grabs input values for email, display name, and password
		const emailInput = document.getElementById('email') as HTMLInputElement;
		const displayNameInput = document.getElementById('displayName') as HTMLInputElement;
		const passwordInput = document.getElementById('password') as HTMLInputElement;

		const email = emailInput?.value;
		const displayName = displayNameInput?.value;
		const password = passwordInput?.value;

		// validates email
		if (!isValidEmail(email)) {
			alert('Invalid email address.');
			return;
		}

		// validates display name
		if (!isValidDisplayName(displayName)) {
			alert('Display Name must be 1 to 9 characters.');
			return;
		}

		// validates password
		if (!isValidPassword(password)) {
			alert('Password must be at least 8 characters, include upper and lower case, a number, and a special character.');
			return;
		}

		// sends a POST request to https://localhost:8044/register with the form data as JSON
		try {
			const response = await fetch("https://localhost:8044/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ email, displayName, password })
			});

			const data = await response.json();

			// on error: shows the error message
			if (!response.ok) {
				alert(data.error || 'Registration failed.');
				return;
			}

			// on success: shows a message with the user’s TOTP secret (for 2FA setup)
			alert(`User registered!\n\nYour TOTP Secret (save it for 2FA setup):\n${data.totpSecret}`);

			// clears fields after success
			emailInput.value = '';
			displayNameInput.value = '';
			passwordInput.value = '';

			// === SPA Navigation to /login ===
			window.history.pushState({}, '', '/login');
			window.dispatchEvent(new PopStateEvent('popstate'));

		}
		catch (error: any) {
			// catches and logs any unexpected errors
			console.error('Registration failed:', error);
			alert('An unexpected error occurred.');
		}
	}
	
	beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
		return;
	}
}
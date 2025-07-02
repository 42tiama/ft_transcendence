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

// function to validate display name (max 20 chars)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 20;
}

// this makes register a view that can be loaded by SPA router
export default class Register extends AbstractView {

	constructor() {
		super();
		// set the page title to "Register" when the view is constructed.
		this.setTitle('Register');
	}

	async getHtml(): Promise<string> {
		try {
			// fetch the HTML template from build/static/html/register.html
			const response = await fetch('build/static/html/register.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// return the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handle errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading register</h1>';
		}
	}

	async onMount(): Promise<void> {
		// find the registration form in the DOM.
		const form = document.querySelector('form');
		if (!form) {
			console.error("Register form not found.");
			return;
		}

		// add 2FA toggle if not present in the HTML template
		let twofaToggle = document.getElementById('enable2fa') as HTMLInputElement | null;
		if (!twofaToggle) {
			// create the toggle element and insert before the submit button
			const passwordDiv = document.getElementById('password')?.parentElement;
			const toggleDiv = document.createElement('div');
			toggleDiv.innerHTML = `
				<label class="block text-xs font-semibold uppercase mb-1" for="enable2fa">
					<input type="checkbox" id="enable2fa" checked />
					Enable Two-Factor Authentication (2FA)
				</label>
			`;
			if (passwordDiv && passwordDiv.parentElement) {
				passwordDiv.parentElement.insertBefore(toggleDiv, passwordDiv.nextSibling);
			}
			twofaToggle = document.getElementById('enable2fa') as HTMLInputElement | null;
		}

		// bind the submit event to submitRegistration.
		form.addEventListener('submit', this.submitRegistration.bind(this));
	}

	private async submitRegistration(e: Event): Promise<any> {
		e.preventDefault();

		// grab input values for email, display name, password and 2FA toogle
		const emailInput = document.getElementById('email') as HTMLInputElement;
		const displayNameInput = document.getElementById('displayName') as HTMLInputElement;
		const passwordInput = document.getElementById('password') as HTMLInputElement;
		const twofaToggle = document.getElementById('enable2fa') as HTMLInputElement | null;

		const email = emailInput?.value;
		const displayName = displayNameInput?.value;
		const password = passwordInput?.value;
		const twofa_enabled = twofaToggle ? twofaToggle.checked : true;

		// validate email
		if (!isValidEmail(email)) {
			alert('Invalid email address.');
			return;
		}

		// validate display name
		if (!isValidDisplayName(displayName)) {
			alert('Display Name must be 1 to 20 characters.');
			return;
		}

		// validate password
		if (!isValidPassword(password)) {
			alert('Password must be at least 8 characters, include upper and lower case, a number, and a special character.');
			return;
		}

		// send a POST request to https://localhost:8044/register with the form data as JSON
		try {
			const response = await fetch("https://localhost:8044/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ email, displayName, password, twofa_enabled })
			});

			const data = await response.json();

			// on error: show the error message
			if (!response.ok) {
				alert(data.error || 'Registration failed.');
				return;
			}

			// on success: show a message with the user’s TOTP secret (for 2FA setup)
			// alert(`User registered!\n\nYour TOTP Secret (save it for 2FA setup):\n${data.totpSecret}`);
			if (twofa_enabled && data.totpSecret) {
				alert(`User registered!\n\nYour TOTP Secret (save it for 2FA setup):\n${data.totpSecret}`);
			} else {
				alert("User Registered!\n\nThe 2FA was not enabled for this account.");
			}

			// clear fields after success
			emailInput.value = '';
			displayNameInput.value = '';
			passwordInput.value = '';
			if (twofaToggle) twofaToggle.checked = true;

			// SPA Navigation to /login ===
			window.history.pushState({}, '', '/login');
			window.dispatchEvent(new PopStateEvent('popstate'));

		}
		catch (error: any) {
			// catch and log any unexpected errors
			console.error('Registration failed:', error);
			alert('An unexpected error occurred.');
		}
	}

	async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
		return true;
	}

	async onUnMount() {
  	}
}
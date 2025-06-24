import TiamaPong from 'game/entities/TiamaPong.js';
import AbstractView from './AbstractView.js';

// function to validate password
function isValidPassword(password: string): boolean {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// function to validate display name (max 9 chars, not empty)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 9;
}

export default class ChangePass extends AbstractView {
	constructor() {
		super();
		// set the page title to "Change Password" when the view is constructed.
		this.setTitle('Change Password');
	}

	async getHtml(): Promise<string> {
		try {
			// fetch the HTML template from build/static/html/changepass.html
			const response = await fetch('build/static/html/changepass.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// return the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handle errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading Change Password</h1>';
		}
	}

	async onMount(): Promise<void> {
		// find the change-password form with ID changepass-form
		const form = document.getElementById('changepass-form') as HTMLFormElement | null;
		if (!form) return;

		// handle 2FA toggle (show/hide TOTP field)
		const use2faToggle = document.getElementById('use2fa-changepass') as HTMLInputElement | null;
		const totpDiv = document.getElementById('totp-div') as HTMLDivElement | null;
		if (use2faToggle && totpDiv) {
			const toggleTOTPVisibility = () => {
				totpDiv.style.display = use2faToggle.checked ? '' : 'none';
			};
			use2faToggle.addEventListener('change', toggleTOTPVisibility);
			toggleTOTPVisibility();
		}

		form.addEventListener('submit', async (e) => {
			// prevent default form submission
			e.preventDefault();

			// grab input values for email, current password, TOTP code, new password, new displayName, toogle 2FA
			const email = (document.getElementById('email') as HTMLInputElement)?.value;
			const currentPassword = (document.getElementById('currentPassword') as HTMLInputElement)?.value;
			const totp = (document.getElementById('totp') as HTMLInputElement)?.value;
			const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
			const newDisplayName = (document.getElementById('newDisplayName') as HTMLInputElement)?.value;
			const use2fa = (document.getElementById('use2fa-changepass') as HTMLInputElement)?.checked;

			// check all fields are filled; alerts if not.
			if (!email || !currentPassword || (!newPassword && !newDisplayName) || (use2fa && !totp)) {
				alert(use2fa
					? "Please fill in email, current password, and at least one of new password or new display name, and TOTP."
					: "Please fill in email, current password, and at least one of new password or new display name.");
				return;
			}

			// validate the new password format; alerts if not strong enough.
			if (newPassword && !isValidPassword(newPassword)) {
				alert("Password must be at least 8 characters, include upper and lower case, a number, and a special character.");
				return;
			}

			// validate the new displayName format;
			if (newDisplayName && !isValidDisplayName(newDisplayName)) {
				alert("Display Name must be 1 to 9 characters.");
				return;
			}

			// build the request body
			const body: any = { email, currentPassword };
			if (use2fa) body.totp = totp;
			if (newPassword) body.newPassword = newPassword;
			if (newDisplayName) body.newDisplayName = newDisplayName;

			// send a POST request to https://localhost:8044/changepass with the form data as JSON.
			try {
				const response = await fetch("https://localhost:8044/changepass", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body)
				});

				const data = await response.json();

				// handle server response
				if (!response.ok) {
					alert(data.error || "Change failed.");
					return;
				}

				// update JWT if backend returns a new token
				if (data.token) {
					localStorage.setItem('jwt', data.token);
				}

				alert("Change successful!");
				form.reset();
				if (use2faToggle && totpDiv) totpDiv.style.display = use2faToggle.checked ? '' : 'none';
			} catch (error) {
				// catch and log any unexpected errors
				alert("An unexpected error occurred.");
			}
		});
	}

	async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
		return true;
	}
}
import AbstractView from './AbstractView.js';

// function to validate password
function isValidPassword(password: string): boolean {
	return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
}

// this makes ChangePass a view that can be loaded by SPA router
export default class ChangePass extends AbstractView {
	constructor() {
		super();
		// sets the page title to "Change Password" when the view is constructed.
		this.setTitle('Change Password');
	}

	async getHtml(): Promise<string> {
		try {
			// fetches the HTML template from build/static/html/changepass.html
			const response = await fetch('build/static/html/changepass.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			// returns the HTML content as a string to be rendered in the view
			return await response.text();
		} catch (error) {
			// handles errors by logging and returning an error message as HTML
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading Change Password</h1>';
		}
	}

	async onMount(): Promise<void> {
		// finds the change-password form with ID changepass-form
		const form = document.getElementById('changepass-form') as HTMLFormElement | null;
		if (!form) return;

		// adds a submit event listener
		form.addEventListener('submit', async (e) => {
			// prevents default form submission
			e.preventDefault();

			// grabs input values for email, TOTP code, and new password
			const email = (document.getElementById('email') as HTMLInputElement)?.value;
			const totp = (document.getElementById('totp') as HTMLInputElement)?.value;
			const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;

			// checks all fields are filled; alerts if not.
			if (!email || !totp || !newPassword) {
				alert("Please fill in all fields.");
				return;
			}

			// validates the new password format; alerts if not strong enough.
			if (!isValidPassword(newPassword)) {
				alert("Password must be at least 8 characters, include upper and lower case, a number, and a special character.");
				return;
			}

			// sends a POST request to https://localhost:8044/changepass with the form data as JSON.
			try {
				const response = await fetch("https://localhost:8044/changepass", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, totp, newPassword })
				});

				const data = await response.json();

				// handles server response
				if (!response.ok) {
					alert(data.error || "Password change failed.");
					return;
				}

				alert("Password changed successfully!");
				form.reset();
			} catch (error) {
				// catches and logs any unexpected errors
				alert("An unexpected error occurred.");
			}
		});
	}
}
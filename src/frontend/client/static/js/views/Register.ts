import AbstractView from './AbstractView.js';

export default class Register extends AbstractView {
  constructor() {
    super();
    this.setTitle('Register');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/static/html/register.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading register</h1>';
    }
  }

	async onMount(): Promise<void> {
		const registerBtn = document.getElementById('registerBtn');

		if (!registerBtn) {
			console.error("Register Button not found.");
			return;
		}

		registerBtn.addEventListener('click', this.submitRegistration);
	}

	private async submitRegistration(e: Event) : Promise<any> {
		e.preventDefault();

		try {
			const response = await fetch("https://localhost:8044/register");

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`Server responded with ${response.status}: ${errText}`);
			}

			const text = await response.text();
			alert(`Server says ${text}`);
			return;
		}
		catch (error) {
			console.error('GET request failed:', error);
			alert('An error occured:' + error.message);
		}
	}
}

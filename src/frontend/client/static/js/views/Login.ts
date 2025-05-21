import AbstractView from './AbstractView.js';

export default class Login extends AbstractView {
  constructor() {
    super();
    this.setTitle('Login');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/frontend/static/html/login.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading login</h1>';
    }
  }

  async onMount() {
    // Wait for Google script to load
    if (!window.google) {
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (window.google) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });
    }

    // Render button programmatically
    window.google.accounts.id.initialize({
      client_id: "445999956724-9nbpuf3kfd38j2hrji5sl86aajcrsaou.apps.googleusercontent.com",
      context: "signin",
      ux_mode: "popup",
      login_uri: "http://localhost:8042/",
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-button"), // Target element
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


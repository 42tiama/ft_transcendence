import AbstractView from './AbstractView.js';

export default class Login extends AbstractView {
  constructor() {
    super();
    this.setTitle('Login');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('/static/html/login.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading login</h1>';
    }
  }
}

import AbstractView from './AbstractView.js';

export default class Register extends AbstractView {
  constructor() {
    super();
    this.setTitle('Register');
  }

  async getHtml(): Promise<string> {
    try {
      const response = await fetch('build/frontend/static/html/register.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading template:', error);
      return '<h1 class="h-96 bg-amber-600">Error Loading register</h1>';
    }
  }
}

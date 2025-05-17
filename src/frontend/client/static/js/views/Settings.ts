import AbstractView from './AbstractView.js';

export default class Settings extends AbstractView {
  constructor() {
    super();
    this.setTitle('Settings');
  }

  async getHtml(): Promise<string> {
    return `
            <h1>SETTINGS</h1>
        `;
  }
}

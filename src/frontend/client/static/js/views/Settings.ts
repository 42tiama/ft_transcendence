import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';

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

  async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
  }

  async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
    return true;
  }

  async onUnMount() {
  }

}

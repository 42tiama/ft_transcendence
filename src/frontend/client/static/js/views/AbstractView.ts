import TiamaPong from "../../../game/entities/TiamaPong";

export default abstract class AbstractView {
  constructor() {}

  setTitle(title: string) {
    document.title = title;
  };

  async getHtml() {
    return "";
  }

  abstract beforeMount(gameContext: TiamaPong | null): Promise<boolean> 

  abstract onMount(gameContext: TiamaPong | null, appElement: Element | null): Promise<void> 
  
  abstract onUnMount(gameContext: TiamaPong | null): Promise<void>
}

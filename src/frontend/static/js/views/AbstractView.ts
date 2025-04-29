export default class AbstractView {
  constructor() {}

  setTitle(title: string) {
    document.title = title;
  };

  async getHtml() {
    return "";
  }
}

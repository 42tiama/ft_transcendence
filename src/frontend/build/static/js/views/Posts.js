import AbstractView from './AbstractView.js';
export default class Posts extends AbstractView {
    constructor() {
        super();
        this.setTitle('Posts');
    }
    async getHtml() {
        return `
            <h1 class="h-96 bg-amber-600" >POSTS</h1>
        `;
    }
}

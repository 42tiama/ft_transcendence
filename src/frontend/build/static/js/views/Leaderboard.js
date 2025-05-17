import AbstractView from './AbstractView.js';
export default class Leaderboard extends AbstractView {
    constructor() {
        super();
        this.setTitle('Leaderboard');
    }
    async getHtml() {
        try {
            const response = await fetch('/static/html/leaderboard.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        }
        catch (error) {
            console.error('Error loading template:', error);
            return '<h1 class="h-96 bg-amber-600">Error Loading leaderboard</h1>';
        }
    }
}

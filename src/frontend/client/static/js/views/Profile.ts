// import AbstractView from './AbstractView.js';

// const API_BASE = 'https://localhost:8044';

// function decodeJwt(token: string) {
// 	if (!token) return null;
// 	try {
// 		const payload = token.split('.')[1];
// 		const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
// 		return JSON.parse(json);
// 	} catch (e) {
// 		return null;
// 	}
// }

// function getRemainingTime(exp: number): string {
// 	if (!exp) return "N/A";
// 	const now = Math.floor(Date.now() / 1000);
// 	const diff = exp - now;
// 	if (diff <= 0) return "Expired";
// 	const min = Math.floor(diff / 60);
// 	const sec = diff % 60;
// 	return `${min}m ${sec}s`;
// }

// export default class Profile extends AbstractView {
// 	constructor() {
// 		super();
// 		this.setTitle('Profile');
// 	}

// 	async getHtml(): Promise<string> {
// 		try {
// 			const response = await fetch('build/static/html/profile.html');
// 			if (!response.ok) throw new Error('Failed to load profile template');
// 			return await response.text();
// 		} catch (err) {
// 			return '<h1 class="h-96 bg-amber-600">Error Loading Profile</h1>';
// 		}
// 	}

// 	async onMount() {
// 		const btn = document.getElementById('show-profile-btn') as HTMLButtonElement;
// 		const info = document.getElementById('profile-info') as HTMLDivElement;
// 		if (!btn || !info) return;

// 		btn.addEventListener('click', async () => {
// 			const token = localStorage.getItem('jwt');
// 			if (!token) {
// 				info.innerHTML = `<div class="text-red-400">No JWT found. Please login first.</div>`;
// 				return;
// 			}

// 			try {
// 				const res = await fetch(`${API_BASE}/profile`, {
// 					headers: { 'Authorization': `Bearer ${token}` }
// 				});
// 				const data = await res.json();

// 				const decoded = decodeJwt(token);
// 				let status = 'valid';
// 				let remain = 'unknown';
// 				if (!decoded || !decoded.exp) {
// 					status = 'invalid';
// 				} else {
// 					remain = getRemainingTime(decoded.exp);
// 					if (remain === 'Expired') status = 'expired';
// 				}

// 				info.innerHTML = `
// 					<div class="mb-4">
// 						<strong>Status:</strong> <span class="${status === 'valid' ? 'text-green-400' : 'text-red-400'}">${status}</span>
// 					</div>
// 					<div class="mb-4">
// 						<strong>Time Remaining:</strong> <span>${remain}</span>
// 					</div>
// 					<div class="mb-4">
// 						<strong>JWT:</strong>
// 						<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${token}</pre>
// 					</div>
// 					<div class="mb-4">
// 						<strong>Decoded JSON:</strong>
// 						<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${JSON.stringify(decoded, null, 2)}</pre>
// 					</div>
// 					<div class="mb-4">
// 						<strong>Server Response:</strong>
// 						<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
// 					</div>
// 				`;
// 			} catch (err) {
// 				info.innerHTML = `<div class="text-red-400">Failed to fetch profile info: ${err}</div>`;
// 			}
// 		});
// 	}
// }

import AbstractView from './AbstractView.js';

const API_BASE = 'https://localhost:8044';

// Utility to decode a JWT (Base64Url decode)
function decodeJwt(token: string) {
	if (!token) return null;
	try {
		const payload = token.split('.')[1];
		const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(json);
	} catch (e) {
		return null;
	}
}

function getRemainingTime(exp: number): string {
	if (!exp) return "N/A";
	const now = Math.floor(Date.now() / 1000);
	const diff = exp - now;
	if (diff <= 0) return "Expired";
	const min = Math.floor(diff / 60);
	const sec = diff % 60;
	return `${min}m ${sec}s`;
}

export default class Profile extends AbstractView {
	constructor() {
		super();
		this.setTitle('Profile');
	}

	async getHtml(): Promise<string> {
		try {
			const response = await fetch('build/static/html/profile.html');
			if (!response.ok) throw new Error('Failed to load profile template');
			return await response.text();
		} catch (err) {
			return '<h1 class="h-96 bg-amber-600">Error Loading Profile</h1>';
		}
	}

	async onMount() {
		const btn = document.getElementById('show-profile-btn') as HTMLButtonElement;
		const info = document.getElementById('profile-info') as HTMLDivElement;
		if (!btn || !info) return;

		btn.addEventListener('click', async () => {
			const token = localStorage.getItem('jwt');
			const googleJwt = localStorage.getItem('google_jwt'); // Retrieve Google Sign-In JWT if stored

			if (!token && !googleJwt) {
				info.innerHTML = `<div class="text-red-400">No JWT found. Please login first.</div>`;
				return;
			}

			let data = {};
			let decoded = null;
			let status = 'valid';
			let remain = 'unknown';

			// Regular JWT status
			if (token) {
				try {
					const res = await fetch(`${API_BASE}/profile`, {
						headers: { 'Authorization': `Bearer ${token}` }
					});
					data = await res.json();
				} catch (err) {
					data = { error: err };
				}

				decoded = decodeJwt(token);
				status = 'valid';
				remain = 'unknown';
				if (!decoded || !decoded.exp) {
					status = 'invalid';
				} else {
					remain = getRemainingTime(decoded.exp);
					if (remain === 'Expired') status = 'expired';
				}
			}

			// Google Sign-In JWT status
			let googleDecoded = null;
			let googleStatus = 'not found';
			let googleRemain = 'N/A';
			if (googleJwt) {
				googleDecoded = decodeJwt(googleJwt);
				googleStatus = 'valid';
				if (!googleDecoded || !googleDecoded.exp) {
					googleStatus = 'invalid';
				} else {
					googleRemain = getRemainingTime(googleDecoded.exp);
					if (googleRemain === 'Expired') googleStatus = 'expired';
				}
			}

			info.innerHTML = `
				<div class="mb-4">
					<strong>Regular Login JWT (App JWT):</strong>
					${token ? `
						<div class="mb-2">
							<strong>Status:</strong> <span class="${status === 'valid' ? 'text-green-400' : 'text-red-400'}">${status}</span>
						</div>
						<div class="mb-2">
							<strong>Time Remaining:</strong> <span>${remain}</span>
						</div>
						<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${token}</pre>
						<div class="mb-2">
							<strong>Decoded JSON:</strong>
							<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${JSON.stringify(decoded, null, 2)}</pre>
						</div>
						<div class="mb-2">
							<strong>Server Response:</strong>
							<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
						</div>
					` : `<span class="text-yellow-400">Not found in localStorage</span>`}
				</div>
				<hr class="my-4" />
				<div class="mb-4">
					<strong>Google Sign-In JWT (Google ID Token):</strong>
					${googleJwt ? `
						<div class="mb-2">
							<strong>Status:</strong> <span class="${googleStatus === 'valid' ? 'text-green-400' : 'text-red-400'}">${googleStatus}</span>
						</div>
						<div class="mb-2">
							<strong>Time Remaining:</strong> <span>${googleRemain}</span>
						</div>
						<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${googleJwt}</pre>
						<div class="mb-2">
							<strong>Decoded JSON:</strong>
							<pre class="whitespace-pre-wrap break-words bg-gray-800 p-2 rounded">${JSON.stringify(googleDecoded, null, 2)}</pre>
						</div>
					` : `<span class="text-yellow-400">Not found in localStorage</span>`}
				</div>
			`;
		});
	}
}
import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import { parseJwt } from '../views/Login.js'
import { resourceLimits } from 'worker_threads';

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

export default class Profile extends AbstractView {
	constructor() {
	    super();
	    this.setTitle('Profile');
	}

	async getHtml(): Promise<string> {
		try {
			const response = await fetch('build/static/html/profile.html');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return await response.text();
		} catch (error) {
			console.error('Error loading template:', error);
			return '<h1 class="h-96 bg-amber-600">Error Loading Profile</h1>';
		}
	}

	async onMount(gameContext: TiamaPong | null, appElement: Element | null) {
		const existingJwt = localStorage.getItem('jwt');

		// extract userId, JWT and time remaining from payload (assume standard claims)
		const payload = parseJwt(existingJwt);
		const userId = payload?.id;
		console.log(payload);

		// Fetch user profile from database
		let userProfile = null;
		if (userId) {
			userProfile = await getUserProfileById(userId);
		}
		console.log(userProfile);
		// const name = userProfile?.name || payload?.preferred_username || 'N/A';
		const displayName = userProfile?.display_name;
		console.log(displayName);
		// const email = userProfile?.email || 'N/A';

		// Set current avatar (fallback to default)
		// const avatarImg = document.getElementById('avatar-preview') as HTMLImageElement;
		// if (avatarImg) {
		// 	const avatarUrl = userProfile?.avatar_url || 'https://localhost:8044/uploads/avatars/TIAMA-logo.png';
		// 	avatarImg.src = avatarUrl;
		// }

		// // Avatar upload preview and POST
		// const avatarInput = document.getElementById('avatar-upload') as HTMLInputElement;
		// trace(avatarInput);

		// ----ACCOUNT ACTIONS----
		// add event listener for change password
		const changepassBtn = document.getElementById('changepass-btn');
		if (changepassBtn) {
			changepassBtn.addEventListener('click', () => {
				// SPA navigation - you may need to trigger your router here
				window.history.pushState({}, '', '/changepass');
				// If you have a SPA router, trigger it to load the view
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
		}

		// add event listener for logout
		const logoutBtn = document.getElementById('logout-btn');
		if (logoutBtn) {
			logoutBtn.addEventListener('click', () => {
				localStorage.removeItem('jwt');
				localStorage.removeItem('google_jwt');
        		localStorage.removeItem('userId');
				alert('You have been logged out successfully!');
				// === SPA Navigation to /login ===
				window.history.pushState({}, '', '/login');
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
		}

		// ----STATS----
		let stat = await getMatchStat(userId);
		if (stat) {
			const wins = document.getElementById('wins-count');
			const losses = document.getElementById('losses-count');
			const winRate = document.getElementById('win-rate');
			const totalMatches = document.getElementById('total-matches');
			if (wins) wins.textContent = stat.wins;
			if (losses) losses.textContent = stat.losses;
			if (winRate) winRate.textContent = stat.winRate + '%';
			if (totalMatches) totalMatches.textContent = stat.totalMatches;
		}

		// ----MATCH HISTORY----
		interface FormattedMatch {
			date: string;
			type: string;
			opponent: string;
			score: string;
			result: string;
		};

		let matches = await getMatchHistory(userId) as FormattedMatch[];
		if (matches) {
			const matchTable = document.getElementById('match-history-table');
			if (matchTable) {
				// Clear table first
				matchTable.innerHTML = '';

				// Create table row for each match
				matches.forEach(match => {
			    	const row = document.createElement('tr');
			    	row.classList.add('border-b', 'border-gray-700');
					var resultEmoji = match.result === 'Win'? '🏆' : '❌';

			    	row.innerHTML = `
			    		<td class="py-2">${match.date}</td>
			    		<td class="py-2">${match.type}</td>
			    		<td class="py-2">${match.opponent}</td>
			    		<td class="py-2">${match.score}</td>
			    		<td class="py-2">${resultEmoji}</td>
			    	`;
      				matchTable.appendChild(row);
				});
			}
		}

		// ----SESSION INFO----
		// Format JWT for 3-line display
		const jwtDisplay = document.getElementById('jwt-formatted');
		if (jwtDisplay) {
			const formattedJwt = formatJwtForDisplay(existingJwt);
			jwtDisplay.textContent = formattedJwt;
		}

		// live update the JWT expiration countdown
		const expiresSpan = document.getElementById('jwt-expires');
		if (expiresSpan && payload?.exp) {
			const interval = setInterval(() => {
				const time = getJwtTimeRemaining(existingJwt);
				expiresSpan.textContent = time;
				if (time === "Expired") clearInterval(interval);
			}, 1000);
		}

		const jwtEmail = document.getElementById('jwt-email');
		if (jwtEmail) {
			jwtEmail.textContent = payload?.email;
		}

		// ----FRIENDS----
		// update the following stats
		await updateFollowStats(userId);

		// add event listener for adding friends
		const addFriendBtn = document.getElementById('add-friend-btn');
		const addFriendMessage = document.getElementById('add-friend-message');

		if (addFriendBtn && addFriendMessage) {
			addFriendBtn.addEventListener('click', async () => {
				const nameInput = document.getElementById('friend-display-name') as HTMLInputElement;
				const friendDisplayName = nameInput?.value.trim();
				if (!friendDisplayName) return;

				const result = await postFriend(userId, friendDisplayName);

				if (result.success) {
		    		addFriendMessage.textContent = `✅ ${result.message}`;
					addFriendMessage.classList.remove('text-red-400');
					addFriendMessage.classList.add('text-green-400');
					await updateFollowStats(userId);
					await updateFriendList(userId);
				}
				else {
		    		addFriendMessage.textContent = `❌ ${result.message}`;
				    addFriendMessage.classList.remove('text-green-400');
				    addFriendMessage.classList.add('text-red-400');
				}
				nameInput.value = '';
				// 🧼 Clear the message after 2 seconds
				setTimeout(() => {
					addFriendMessage.textContent = '';
				}, 2000);
			});
		}

		// list friends added by user
		await updateFriendList(userId);

		// add event listener for deleting friends
		const friendsList = document.getElementById('friends-list');
		if (friendsList) {
			friendsList.addEventListener('click', async (e) => {
				const button = (e.target as HTMLElement).closest('button');
				if (!button) return;

				const friendCard = button.closest('li');
				const friendId = friendCard?.dataset.friendId;
				if (!friendId) return;

				const confirmed = confirm('Remove this friend?');
				if (!confirmed) return;

				button.disabled = true;

				try {
					const res = await fetch(`${API_BASE}/friend-delete`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userId, friendId})
					});

					if (!res.ok) throw new Error('Failed to delete friend. Try again.');
					await updateFollowStats(userId);
					await updateFriendList(userId);
				} catch (err) {
					console.error(err);
					alert('Could not remove friend.');
					button.disabled = false;
				}
			});
		}
		return;
	}

	async beforeMount(gameContext: TiamaPong | null): Promise<boolean> {
 	   return true;
	}

	async onUnMount() {
  	}
}

// returns time remaining (as string) until JWT expiration
function getJwtTimeRemaining(token: string | null): string {
	const payload = parseJwt(token);
	if (!payload || !payload.exp) return "N/A";
	const now = Math.floor(Date.now() / 1000);
	const remainingSec = payload.exp - now;
	if (remainingSec <= 0) return "Expired";
	const min = Math.floor(remainingSec / 60);
	const sec = remainingSec % 60;
	return `${min}m ${sec}s`;
}

// breaks a long JWT string into 3 lines
function formatJwtForDisplay(jwt: string | null): string {
	if (!jwt) return "";
	const partLength = Math.ceil(jwt.length / 3);
	const lines = [];
	for (let i = 0; i < 3; i++) {
		lines.push(jwt.slice(i * partLength, (i + 1) * partLength));
	}
	return lines.join('\n');
}

// fetches user profile data from profile service
async function getUserProfileById(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/profile-by-id/${userId}`, {
			method: 'GET'
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}

//get follow stats
async function updateFollowStats(userId: number) {
	try {
		const response = await fetch(`${API_BASE}/follow-stat/${userId}`);
		const followStat = await response.json();
		if (followStat) {
			const following = document.getElementById('following-count');
			const followers = document.getElementById('followers-count');
			if (following) following.textContent = followStat.following;
			if (followers) followers.textContent = followStat.followers;
		}
		return followStat;
	} catch (error) {
		console.error('Error fetching friends for Stat:', error);
		return null;
	}
}

//post friend using display name
async function postFriend(userId: string, displayName: string): Promise<any> {
	try {
	    const response = await fetch(`${API_BASE}/friend-register`, {
	    	method: 'POST',
	    	headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, displayName })
    	});

	    const result = await response.json();

		if (response.ok) {
			return { success: true, message: result.message};
		} else {
			return { success: false, message: result.error};
		}
	} catch (error) {
		console.error('Error posting friend:', error);
		return null;
	}
}

interface Friend {
	id: number;
	displayName: string;
	avatarUrl: string;
	cardColor: string;
}

// get list of friends added
async function updateFriendList(userId: number) {
	try {
		const response = await fetch(`${API_BASE}/friend-list/${userId}`);
		const data = await response.json();
		const friends = data.data as Friend[];
		const list = document.getElementById('friends-list');

		if (list) {
			// Clear list first
			list.innerHTML = '';

			if (friends) {
				// Create list item for each friend
				friends.forEach(friend => {
					const avatar = friend.avatarUrl
						? `<img src="${friend.avatarUrl}" class="w-8 h-8 rounded-full object-cover" alt="${friend.displayName}">`
						: `<div class="w-8 h-8 rounded-full bg-white text-gray-700 font-extrabold text-center flex items-center justify-center text-lg">
 					    	${friend.displayName.charAt(0)}
 					   	   </div>`;
					const li = document.createElement('li');
					li.className = 'relative flex items-center gap-3 p-2 bg-gray-700 rounded';
					li.dataset.friendId = friend.id.toString();

					li.innerHTML = `
					    <button class="absolute top-0 right-3 text-red-400 hover:text-red-600 text-lg cursor-pointer" title="Remove friend">&times;</button>
						${avatar}
					  	<span class="text-white">${friend.displayName}</span>
					`;

					list.appendChild(li);
				});
			}
		} else {
			console.info("User hasn't added any friends.");
		}
		return friends;
	} catch (error) {
		console.error('Error fetching list of friends:', error);
		return null;
	}
}

// fetches match stat from game service
//TODO - change path on api-gateway
async function getMatchStat(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/match-stat/${userId}`, {
			method: 'GET'
		});

		const data = await response.json();
		if (!data.data) {
			console.info(`User has no Match Stat.`);
			return null;
		}
		return data.data;
	} catch (error) {
		console.error('Error fetching matches for Stat:', error);
		return null;
	}
}

// fetches match history from game service
//TODO - change path on api-gateway
async function getMatchHistory(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/match-hist/${userId}`, {
			method: 'GET'
		});

		const data = await response.json();
		if (data.data.length === 0) {
			console.info(`User has no Match History.`);
			return null;
		}
		return data.data;
	} catch (error) {
		console.error('Error fetching matches for History:', error);
		return null;
	}

}
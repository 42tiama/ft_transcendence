import AbstractView from './AbstractView.js';
import TiamaPong from '../../../game/entities/TiamaPong.js';
import { parseJwt } from '../views/Login.js'

// sets the API base URL to the API gateway for all authentication requests.
const API_BASE = 'https://localhost:8044';

// keep track of id to stop periodically updating the friend list
let friendListIntervalId: number | null = null;

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
		if (!userId) {
			console.warn("No userId found in JWT payload.");
			window.location.href = "/login";
			return;
		}

		// Update current profile avatar, display name and card color from database
		await loadProfile(userId);

		//update avatar preview when the user picks a new one
		const avatarUpload = document.getElementById("avatar-upload") as HTMLInputElement;
	    const avatarPreviewContainer = document.getElementById("avatar-preview-container") as HTMLDivElement;
		if (avatarUpload && avatarPreviewContainer) {
			avatarUpload?.addEventListener("change", () => {
				const file = avatarUpload.files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
					  	avatarPreviewContainer.innerHTML = `
					    	<img src="${e.target?.result}" alt="Avatar Preview"
					        class="w-full h-full object-contain rounded-full bg-white" />
					  	`;
					};
				reader.readAsDataURL(file);
				}
			});
		}

		//update card preview when the user picks a new one
		const cardColorPicker = document.getElementById('card-color-input') as HTMLInputElement;
		const cardColorPreview = document.getElementById("card-color-preview");
		if (cardColorPicker && cardColorPreview) {
			cardColorPicker.addEventListener("input", (e) => {
				const newColor = (e.target as HTMLInputElement).value;
			    cardColorPreview.style.backgroundColor = newColor;
			});
		}

		// profile update form input
		const form = document.getElementById('update-profile-form') as HTMLFormElement;
		if (!form) return;
		form.addEventListener('submit', async (e) => {
			// prevent default form submission
			e.preventDefault();

			// grab input for avatar file, card color and display name in formData
			const formData = new FormData(form);

			// validate the new displayName format;
			const newDisplayName = formData.get('displayName') as string;
			if (!isValidDisplayName(newDisplayName)) {
				alert("Display Name must be 1 to 20 characters.");
				return;
			}

			const result = await postUpdateProfile(userId, formData);
			if (result && result.success) {
				alert("Profile updated successfully!");
				await loadProfile(userId);
			}
			else {
				// Display the actual error message from the backend
				const errorMessage = result?.error || "An error occurred while updating the profile.";
				alert(errorMessage);
			}
		});

		// ----SESSION INFO----
		// Format JWT for 6-line display
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

		// ----ACCOUNT ACTIONS----
		// add event listener for logout
		const logoutBtn = document.getElementById('logout-btn');
		if (logoutBtn) {
			logoutBtn.addEventListener('click', () => {
				localStorage.removeItem('jwt');
				localStorage.removeItem('google_jwt');
        		localStorage.removeItem('userId');
				stopFriendListRefresh();
				alert('You have been logged out successfully!');
				// === SPA Navigation to /login ===
				window.history.pushState({}, '', '/login');
				window.dispatchEvent(new PopStateEvent('popstate'));
			});
		}

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

				if (result && result.success) {
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
		startFriendListRefresh(userId);

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

// fetches user profile data from profile service
async function getUserProfileById(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/profile-by-id/${userId}`, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}

//get the current avatar, diplay name and card color
async function loadProfile(userId: number) {
	const userProfile = await getUserProfileById(userId);
	if (!userProfile) return;

	// === Avatar ===
	const avatarPreviewContainer = document.getElementById("avatar-preview-container") as HTMLDivElement;
	if (avatarPreviewContainer) {
		avatarPreviewContainer.innerHTML = "";

		if (userProfile.avatarUrl) {
			const img = document.createElement("img");
			img.src = `${API_BASE}${userProfile.avatarUrl}`;
			img.className = "w-full h-full object-contain rounded-full";
			avatarPreviewContainer.appendChild(img);
		} else {
			avatarPreviewContainer.textContent = userProfile.displayName.charAt(0);
		}
	}

	// === Display Name ===
	const displayNameInput = document.getElementById("display-name-input") as HTMLInputElement;
	if (displayNameInput) {
		displayNameInput.value = userProfile.displayName;
	}

	// === Card Color ===
	const cardColorPicker = document.getElementById("card-color-input") as HTMLInputElement;
	const cardColorPreview = document.getElementById("card-color-preview");
	if (cardColorPicker) {
		cardColorPicker.value = userProfile.cardColor;
	}
	if (cardColorPreview) {
		cardColorPreview.style.backgroundColor = userProfile.cardColor;
	}
}

// function to validate display name (max 20 chars, not empty)
function isValidDisplayName(displayName: string): boolean {
	return typeof displayName === 'string' && displayName.trim().length > 0 && displayName.trim().length <= 20;
}

//post update profile
async function postUpdateProfile(userId: number, formData: FormData): Promise<any> {
	try {
	    const response = await fetch(`${API_BASE}/profile-update/${userId}`, {
	    	method: 'POST',
			body: formData
    	});

	    const result = await response.json();
		return result;
	} catch (error) {
		console.error('Error updating profile:', error);
		return { success: false, error: 'Network error. Please try again.' };
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

// breaks a long JWT string into 6 lines
function formatJwtForDisplay(jwt: string | null): string {
	if (!jwt) return "";
	const partLength = Math.ceil(jwt.length / 6);
	const lines = [];
	for (let i = 0; i < 6; i++) {
		lines.push(jwt.slice(i * partLength, (i + 1) * partLength));
	}
	return lines.join('\n');
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
				//check if friends updated lastSeen in the last 10 seconds
				const statuses = await Promise.all(friends.map(friend => getOnlineStatus(friend.id)));

				// Create list item for each friend
				friends.forEach((friend, index) => {
					const avatar = friend.avatarUrl
						? `<img src="${API_BASE}${friend.avatarUrl}" class="w-11 h-11 rounded-full object-contain bg-white" alt="${friend.displayName}">`
						: `<div class="w-11 h-11 rounded-full bg-white text-gray-700 font-extrabold text-center flex items-center justify-center text-lg">
 					    	${friend.displayName.charAt(0)}
 					   	   </div>`;
					const isOnline = statuses[index];
					const statusDot = `<span class="w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}"></span>`;
					const statusText = `<span class="text-sm ${isOnline ? 'text-green-400' : 'text-gray-400'}">${isOnline ? 'Online' : 'Offline'}</span>`;

					const li = document.createElement('li');
					li.className = 'relative flex justify-between p-2 pl-3 pr-3 bg-gray-700 rounded min-h-[42px]';

					li.dataset.friendId = friend.id.toString();

					li.innerHTML = `
						<button class="absolute top-0 right-3 text-red-400 hover:text-red-600 text-lg cursor-pointer" title="Remove friend">&times;</button>

						<!-- Left side: avatar and name, vertically centered -->
						<div class="flex items-center gap-3">
							${avatar}
							<span class="text-white font-medium">${friend.displayName}</span>
						</div>

						<!-- Right side: status, aligned bottom -->
						<div class="flex flex-col justify-between items-end ml-auto" style="height: 100%; min-height: 42px;">
							<div></div> <!-- empty spacer to push status down -->
							<div class="flex items-center gap-2">
								${statusDot}
								${statusText}
							</div>
						</div>
					`;

					list.appendChild(li);
				});
			}
		}
		return friends;
	} catch (error) {
		console.error('Error fetching list of friends:', error);
		return null;
	}
}

async function getOnlineStatus(friendId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/online-status/${friendId}`);
		const data = await response.json();
		return data.online;
	} catch (error) {
		console.error(`Failed to fetch status for friend ${friendId}`, error);
		return false;
	}
}

// Periodically update the friend list
function startFriendListRefresh(userId: number, intervalMs = 10000) {
  friendListIntervalId = window.setInterval(() => {
    updateFriendList(userId);
  }, intervalMs);
}

function stopFriendListRefresh() {
  if (friendListIntervalId !== null) {
    clearInterval(friendListIntervalId);
    friendListIntervalId = null;
  }
}

// fetches match stat from game service
async function getMatchStat(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/match/player/${userId}/stats`, {
			method: 'GET'
		});

		const data = await response.json();
		if (data && !data.data) {
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
async function getMatchHistory(userId: number): Promise<any> {
	try {
		const response = await fetch(`${API_BASE}/match/player/${userId}/matches`, {
			method: 'GET'
		});

		const data = await response.json();
		if (data && !data.data) {
			console.info(`User has no Match History.`);
			return null;
		}
		return data.data;
	} catch (error) {
		console.error('Error fetching matches for History:', error);
		return null;
	}

}
const showFormBtn = document.getElementById('showFormBtn') as HTMLButtonElement;
const fetchUsersBtn = document.getElementById('fetchUsersBtn') as HTMLButtonElement;
const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const responseDiv = document.getElementById('response') as HTMLDivElement;
const usersResponseDiv = document.getElementById('usersResponse') as HTMLDivElement;
const usersTable = document.getElementById('usersTable') as HTMLTableElement;

showFormBtn.addEventListener('click', function () {
  dataForm.style.display = 'block';
});

dataForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const formData = new FormData(dataForm);
  const payload: Record<string, string> = {};

  formData.forEach(function (value, key) {
    payload[key] = value.toString();
  });

  fetch('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
    .then(function (res) {
      return res.json();
    })
    .then(function (result) {
      responseDiv.textContent = 'Server response: ' + JSON.stringify(result);
    })
    .catch(function (err) {
      responseDiv.textContent = 'Error: ' + err;
    });
});

interface User {
	id: number;
	name: string;
	email: string;
};

fetchUsersBtn.addEventListener('click', function () {
  fetch('/users')
    .then(function (res) {
      return res.json(); // Read body as json
    })
    .then(function (users: User[]) {
		if (users.length === 0) {
			usersTable.innerHTML = '<tr><td> No users found</td></tr>';
				return;
		}

		//table header
		const headerRow = document.createElement('tr');
		Object.keys(users[0]).forEach(key => {
				const th = document.createElement('th');
				th.textContent = key;
				headerRow.appendChild(th);
			});
		usersTable.appendChild(headerRow);

		//table Content
		users.forEach(user => {
				const row = document.createElement('tr');
				Object.values(user).forEach(value => {
					const td = document.createElement('td');
					td.textContent = value;
					row.appendChild(td);
				});
				usersTable.appendChild(row);
			});
    })
    .catch(function (err) {
      usersResponseDiv.textContent = 'Error: ' + err;
    });
});


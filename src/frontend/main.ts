const showFormBtn = document.getElementById('showFormBtn') as HTMLButtonElement;
const fetchServiceBtn = document.getElementById('fetchServiceBtn') as HTMLButtonElement;
const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const responseDiv = document.getElementById('response') as HTMLDivElement;
const serviceResponseDiv = document.getElementById('serviceResponse') as HTMLDivElement;

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

fetchServiceBtn.addEventListener('click', function () {
  fetch('/service1')
    .then(function (res) {
      return res.text(); // Read body as plain text
    })
    .then(function (body) {
      serviceResponseDiv.textContent = body;
    })
    .catch(function (err) {
      serviceResponseDiv.textContent = 'Error: ' + err;
    });
});


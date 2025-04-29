const showFormBtn = document.getElementById('showFormBtn') as HTMLButtonElement;
const dataForm = document.getElementById('dataForm') as HTMLFormElement;
const responseDiv = document.getElementById('response') as HTMLDivElement;

showFormBtn.addEventListener('click', () => {
  dataForm.style.display = 'block';
});

dataForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const formData = new FormData(dataForm);
  const payload: Record<string, string> = {};

  formData.forEach((value, key) => {
    payload[key] = value.toString();
  });

  fetch('/api/submit', {
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

var showFormBtn = document.getElementById('showFormBtn');
var dataForm = document.getElementById('dataForm');
var responseDiv = document.getElementById('response');
showFormBtn.addEventListener('click', function () {
    dataForm.style.display = 'block';
});
dataForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(dataForm);
    var payload = {};
    formData.forEach(function (value, key) {
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

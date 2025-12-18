const API_URL = '/api';

const loginForm = document.querySelector('.login-form');

const mailInput = document.querySelector('#form-mail-input');
const passInput = document.querySelector('#form-pass-input');


if(sessionStorage.getItem('message')) {
  alert(sessionStorage.getItem('message'));
  sessionStorage.removeItem('message');
}

loginForm.addEventListener('submit', e => {
    e.preventDefault();


    fetch(API_URL + '/auth/login', {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            mail: mailInput.value,
            password: passInput.value,
        }),
    })
    .then(res => {
            return res.json().then(data => {
                if(res.ok) {
                    sessionStorage.setItem("message", data.message);
                    window.location.replace('./transactions.html');
                } else {
                    throw Error(data.message);
                }});
    }) .catch(err => alert(err.message));
}
);
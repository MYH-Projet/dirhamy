const API_URL = '/api';

const loginForm = document.querySelector('.login-form');

const mailInput = document.querySelector('#form-mail-input');
const passInput = document.querySelector('#form-pass-input');

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
        if(res.ok) {
            return res.json();
        } else {
            return null; // can i throw an error here and have it caught with .catch , i think yes an error happening means a promise not fullfilled thus i can catch
        }
    }) 
    .then(data => {if(data) {  // i guess pass in the error message somehow if its possible
        sessionStorage.setItem("message", data.message);
        window.location.replace('./transactions.html');
    } else {
        alert('Invalid Credentials');// toast failed login is better, alert is enough for now
    }}

);

}
)
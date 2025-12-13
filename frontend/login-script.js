const API_URL = '/api'

const loginForm = document.querySelector('.login-form');

const mailInput = document.querySelector('#form-mail-input');
const passInput = document.querySelector('#form-pass-input');

loginForm.addEventListener('submit', e => {
    e.preventDefault();


    fetch(API_URL + '/auth/login' , {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            mail: mailInput.value,
            password: passInput.value,
        }),
    }) .then (res => res.json())
        .then (data => console.log(data));

}
)
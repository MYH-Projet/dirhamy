const API_URL = 'http://localhost:3000/api';

const dateInput = document.querySelector('#transaction-form-date');

dateInput.value = new Date().toISOString().split('T')[0]; /* look for a better way */

function getTransactions() {

}

function renderTransactions(transactions){

}
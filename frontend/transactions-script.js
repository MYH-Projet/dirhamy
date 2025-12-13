const API_URL = '/api';

const dateInput = document.querySelector('#transaction-form-date');

dateInput.value = new Date().toISOString().split('T')[0]; /* look for a better way */

const typeTransactionInput = document.querySelector('#transaction-form-type');

const formTransferUnit = document.querySelector('#form-unit-transfer');

typeTransactionInput.addEventListener('change', e => {
    if(typeTransactionInput.value === 'transfer') {
        formTransferUnit.classList.remove('invisible-unit');
    } else {
        formTransferUnit.classList.add('invisible-unit');
    }
});

function getTransactions() {

}

function renderTransactions(transactions){

}
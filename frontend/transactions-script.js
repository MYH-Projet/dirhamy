document.addEventListener('DOMContentLoaded', () => {
const API_URL = '/api';
const transactionsContainer = document.querySelector(
  '.list-transaction-container'
);
let originalTransaction = null;

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

async function getTransactions() {
  try {
    const res = await fetch(`${API_URL}/transactions/user`, {
      method: 'GET',
      credentials: 'include', // IMPORTANT: JWT dans cookies
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    // Backend renvoie { data: [...], meta: {...} }
    const transactions = (json.data || []).map(t => {
      const amountAbs = Math.abs(Number(t.montant));

      // couleur: income si montant positif, expense si négatif
      const uiType = Number(t.montant) > 0 ? 'income' : 'expense';

      return {
        id: t.id,
        date: (t.date || '').slice(0, 10),
        category: t.categorie?.nom || '—',
        description: t.description || '—',
        amount: amountAbs,
        type: uiType,

        // utile pour PUT plus tard
        categorieId: t.categorie?.id || null,
      };
    });

    renderTransactions(transactions);
  } catch (err) {
    console.error('GET transactions failed:', err);
    transactionsContainer.innerHTML = `
      <h3>Recent Transactions</h3>
      <p>Erreur lors du chargement des transactions</p>
    `;
  }
}



function renderTransactions(transactions) {
  transactionsContainer.innerHTML = `
    <h3>Recent Transactions</h3>
  `;

  if (!transactions.length) {
    transactionsContainer.innerHTML += `
      <p>Aucune transaction pour le moment</p>
    `;
    return;
  }

  const table = document.createElement('table');
  table.classList.add('transactions-table');

  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  transactions
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 5)
  .forEach(tx => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.category}</td>
      <td>${tx.description}</td>
      <td class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">
        ${tx.type === 'income' ? '+' : '-'}${tx.amount} DH
      </td>
    `;

    // 👇 IMPORTANT : stocker la transaction
    row.addEventListener('click', () => {
      selectTransaction(tx);
    });

    tbody.appendChild(row);
  });


  transactionsContainer.appendChild(table);
}
let selectedTransaction = null;

function selectTransaction(transaction) {
  selectedTransaction = transaction;
  console.log('Transaction sélectionnée:', selectedTransaction);
  openTransactionModal(transaction);
}

function openTransactionModal(transaction) {
  if (!transaction) return;

  originalTransaction = { ...transaction };

  document.getElementById('modal-date').value = transaction.date;
  document.getElementById('modal-type').value = transaction.type;
  document.getElementById('modal-category').value = transaction.category;
  document.getElementById('modal-description').value = transaction.description;
  document.getElementById('modal-amount').value = transaction.amount;

  document.getElementById('modal-save-btn').disabled = true;

  document.getElementById('transaction-modal-overlay')
    .classList.remove('hidden');
}

function closeTransactionModal() {
  document.getElementById('transaction-modal-overlay')
    .classList.add('hidden');
}


function hasTransactionChanged() {
  return (
    document.getElementById('modal-date').value !== originalTransaction.date ||
    document.getElementById('modal-type').value !== originalTransaction.type ||
    document.getElementById('modal-category').value !== originalTransaction.category ||
    document.getElementById('modal-description').value !== originalTransaction.description ||
    Number(document.getElementById('modal-amount').value || 0) !== originalTransaction.amount
  );
}

['modal-date', 'modal-type', 'modal-category', 'modal-description', 'modal-amount']
  .forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const changed = hasTransactionChanged();
      const saveBtn = document.getElementById('modal-save-btn');

      saveBtn.disabled = !changed;

      console.log('Form changed:', changed);
    });
  });




document.getElementById('modal-delete-btn').addEventListener('click', () => {
  const confirmed = confirm(
    'Êtes-vous sûr de vouloir supprimer cette transaction ?'
  );

  if (!confirmed) return;

  console.log('Suppression confirmée (API plus tard)');
});



document.getElementById('modal-close-btn')
  .addEventListener('click', closeTransactionModal);

document.getElementById('modal-cancel-btn')
  .addEventListener('click', closeTransactionModal);

getTransactions();
});
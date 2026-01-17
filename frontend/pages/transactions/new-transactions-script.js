import { displayToast } from "../../components/toast.js";
import {
  loadInitialStructure,
  deleteIcon,
  editIcon,
  API_URL,
} from "../../utils/utils.js";

const user = {};

const getTransactionTypeClass = {
  DEPENSE: "expense-color",
  REVENU: "income-color",
  TRANSFER: "transfer-color",
};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getAccountBalances(user);
  fetchAndRenderAddTransactionContainer(user);
  getTransactions();
});

// Populates the user object with the new balance
function getAccountBalances(user) {
  const promises = [];

  user.accounts.forEach((account) => {
    promises.push(
      fetch(API_URL + "/balance?compteId=" + account.id).then((res) =>
        res.json().then((data) => {
          if (res.ok) {
            account.balance = data.balance;
          } else {
            displayToast(
              document.querySelector(".toasts-container"),
              data.error || data.message,
              "error",
            );
          }
        }),
      ),
    );
  });

  return Promise.all(promises).then(() => {
    renderAccounts(user);
  });
}

function renderAccounts(user) {
  const balanceCardsContainer = document.querySelector(".balance-container");

  let totalBalance = 0;

  user.accounts.forEach((account) => {
    const balanceCard = createBalanceCard(account);

    totalBalance += account.balance;
    balanceCardsContainer.append(balanceCard);
  });

  document.querySelector(".total-card-balance").textContent = totalBalance;
}

function createBalanceCard(account) {
  const card = document.createElement("article");
  card.classList.add("card", "primary-card", "account-card");

  const cardLabel = document.createElement("p");
  cardLabel.classList.add("card-label", "account-card-label");
  const accountName = document.createElement("span");
  accountName.classList.add("account-card-name");
  accountName.textContent = account.nom;

  const accountType = document.createElement("span");
  accountType.classList.add("account-card-type");
  accountType.textContent = account.type;

  cardLabel.append(accountName, accountType);

  const cardBalance = document.createElement("p");
  cardBalance.classList.add("card-balance", "account-card-balance");
  cardBalance.textContent = account.balance;

  card.append(cardLabel, cardBalance);
  return card;
}

function getTransactions() {
  return fetch(API_URL + "/transactions/user").then((res) =>
    res.json().then((data) => {
      if (res.ok) {
        renderTransactions(data.data);
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          data.error || data.message,
          "error",
        );
      }
    }),
  );
}

function renderTransactions(transactions) {
  tbody = document.querySelector("table.list-entity-container tbody");
  transactions.toSorted().forEach((transaction) => {
    const tableRow = createTransactionRow(transaction);
    tbody.append(tableRow);
  });
}

function createTransactionRow(transaction) {
  const tableRow = document.createElement("tr");
  tableRow.dataset.id = transaction.id;

  const transactionDate = document.createElement("td");
  transactionDate.textContent = transaction.date.split("T")[0];

  const transactionClass = getTransactionTypeClass[transaction.type];

  const transactionType = document.createElement("td");
  transactionType.classList.add(transactionClass);
  transactionType.textContent = capitalizeString(transaction.type);

  const transactionCategory = document.createElement("td");
  transactionCategory.textContent = transaction.category.nom;
  transactionCategory.dataset.categoryId = transaction.categoryId;

  const transactionDescription = document.createElement("td");
  transactionDescription.textContent = transaction.description;

  const transactionAmount = document.createElement("td");
  transactionAmount.classList.add(transactionClass);
  transactionAmount.textContent = transaction.montant;

  const actionBtns = document.createElement("td");
  actionBtns.classList.add("action-btns");
  actionBtns.innerHTML = editIcon + deleteIcon;

  tableRow.append(
    transactionDate,
    transactionType,
    transactionCategory,
    transactionDescription,
    transactionAmount,
    actionBtns,
  );

  return tableRow;
}

function fetchAndRenderAddTransactionContainer(user) {
  fetch(API_URL + "/categories").then((res) =>
    res.json().then((data) => {
      if (res.ok) {
        const selectAccount = document.querySelector("#add-account-field");
        user.accounts.forEach((account) => {
          const option = document.createElement("option");
          option.value = account.id;
          option.textContent = account.nom;
          selectAccount.append(option);
        });

        const selectCategory = document.querySelector("#add-category-field");
        data.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.nom;
          selectCategory.append(option);
        });
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          data.error || data.message,
          "error",
        );
      }
    }),
  );

  return null;
}

function wireTableEvents() {
  document
    .querySelector("table.list-entity-container tbody")
    .addEventListener("click", (e) => {
      const editIconBehavior = checkTransactionIconBehavior();
      const deleteIconBehavior = checkTransactionIconBehavior();
    });
}

function capitalizeString(string) {
  const lowerCase = string.toLowerCase();
  return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
}

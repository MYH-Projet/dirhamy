import { deleteIcon, editIcon } from "./common-ui.js";
import { getKeyByValue } from "../helpers/utils.js";

const getTransactionTypeClass = {
  DEPENSE: "expense-color",
  REVENU: "income-color",
  TRANSFER: "transfer-color",
};

const getTransactionTypeName = {
  DEPENSE: "Expense",
  REVENU: "Income",
  TRANSFER: "Transfer",
};

export function renderTransactions(transactions) {
  transactions = transactions.data;

  const tableBody = document.querySelector("table.list-entity-container tbody");
  tableBody.innerHTML = "";
  transactions
    .toSorted((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return -(dateA.getTime() <= dateB.getTime());
    })
    .forEach((transaction) => {
      const tableRow = createTransactionRow(transaction);
      tableBody.append(tableRow);
    });
}

export function createTransactionRow(transaction) {
  const tableRow = document.createElement("tr");
  tableRow.dataset.id = transaction.id;

  const transactionDate = document.createElement("td");
  transactionDate.dataset.fullDate = transaction.date;
  transactionDate.textContent = transaction.date.split("T")[0];

  const transactionClass = getTransactionTypeClass[transaction.type];

  const transactionType = document.createElement("td");
  transactionType.classList.add(transactionClass, "type-column");
  transactionType.textContent = getTransactionTypeName[transaction.type];

  const transactionCategory = document.createElement("td");
  transactionCategory.textContent = transaction.categorie.nom;
  transactionCategory.dataset.categoryId = transaction.categorieId;

  const transactionDescription = document.createElement("td");
  transactionDescription.textContent = transaction.description;

  const transactionAmount = document.createElement("td");
  transactionAmount.classList.add(transactionClass, "amount-column");
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

export function getNeededTransactionData(tableRow) {
  const transactionData = {};

  let currentTd = tableRow.firstChild;
  transactionData.id = tableRow.dataset.id;
  transactionData.date = currentTd.dataset.fullDate;

  currentTd = currentTd.nextSibling;
  transactionData.type = getKeyByValue(
    getTransactionTypeName,
    currentTd.textContent,
  );

  currentTd = currentTd.nextSibling;
  transactionData.categoryName = currentTd.textContent;
  transactionData.categoryId = currentTd.dataset.categoryId;

  currentTd = currentTd.nextSibling;
  transactionData.description = currentTd.textContent;

  currentTd = currentTd.nextSibling;
  transactionData.amount = Math.abs(+currentTd.textContent);

  return transactionData;
}

export function checkTransactionIconClick(table, node, className) {
  const svg = node.closest("svg");

  let res = {
    isClicked: null,
  };
  if (!svg) {
    res.isClicked = false;
    return res;
  }
  if (!table.contains(svg)) {
    res.isClicked = false;
    return res;
  }

  const tableRow = svg.closest("tr");

  res = { ...res, ...getNeededTransactionData(tableRow) };

  if (svg.classList.contains(className)) {
    res.isClicked = true;
    return res;
  } else {
    res.isClicked = false;
    return res;
  }
}

export function renderAccounts(user) {
  const balanceCardsContainer = document.querySelector(".balance-container");

  balanceCardsContainer.innerHTML = `<article class="card secondary-card total-card">
          <p class="card-label total-card-label">TOTAL WEALTH</p>
          <p class="card-balance total-card-balance"></p>
        </article>`;
  let totalBalance = 0;

  user.accounts.forEach((account) => {
    const balanceCard = createBalanceCard(account);
    totalBalance += account.balance;
    balanceCardsContainer.insertBefore(
      balanceCard,
      balanceCardsContainer.firstChild,
    );
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
  accountName.textContent = account.nom.toUpperCase();

  const accountType = document.createElement("span");
  accountType.classList.add("account-card-type");
  accountType.textContent = account.type.toUpperCase();

  cardLabel.append(accountName, accountType);

  const cardBalance = document.createElement("p");
  cardBalance.classList.add("card-balance", "account-card-balance");
  cardBalance.textContent = account.balance;

  card.append(cardLabel, cardBalance);
  return card;
}

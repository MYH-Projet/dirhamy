import { deleteIcon, editIcon } from "/ui/common-ui.js";

// make all this in one object
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

const incomeIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 12L12 4M12 4L12 9M12 4L7 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const expenseIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4L4 12M4 12L4 7M4 12L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const transferIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5L13 5M13 5L10 2M13 5L10 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 11L3 11M3 11L6 8M3 11L6 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const getTransactionTypeInfo = {
  DEPENSE: { class: "expense-color", icon: expenseIcon, name: "Expense" },
  REVENU: { class: "income-color", icon: incomeIcon, name: "Income" },
  TRANSFER: { class: "transfer-color", icon: transferIcon, name: "Transfer" },
};

const getTransactionTypeIcon = {
  DEPENSE: expenseIcon,
  REVENU: incomeIcon,
  TRANSFER: transferIcon,
};

export function renderTransactions(transactions, nextCursor) {
  const tableBody = document.querySelector("table.list-entity-container tbody");
  tableBody.innerHTML = "";
  appendTransactionsToTable(transactions, nextCursor);
}

export function appendTransactionsToTable(transactions, nextCursor) {
  const tableBody = document.querySelector("table.list-entity-container tbody");
  transactions
    .toSorted((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return (dateA.getTime() <= dateB.getTime());
    })
    .forEach((transaction) => {
      const tableRow = createTransactionRow(transaction);
      tableBody.append(tableRow);
    });

  const showMoreBtn = document.querySelector("#show-more-btn");
  if (nextCursor) {
    showMoreBtn.disabled = false;
    showMoreBtn.dataset.cursor = nextCursor;
  } else {
    showMoreBtn.disabled = true;
    showMoreBtn.dataset.cursor = "";
  }
}
export function createTransactionRow(transaction) {
  const tableRow = document.createElement("tr");
  tableRow.dataset.id = transaction.id;

  const transactionDate = document.createElement("td");
  transactionDate.classList.add("date-column");
  transactionDate.dataset.fullDate = transaction.date;
  transactionDate.textContent = transaction.date.split("T")[0];

  const transactionInfo = getTransactionTypeInfo[transaction.type];

  const transactionType = document.createElement("td");
  transactionType.classList.add("type-column");
  transactionType.innerHTML = `<div>${transactionInfo.icon} <span></span></div>`;
  transactionType.querySelector("div").classList.add(transactionInfo.class);
  transactionType.querySelector("span").textContent = transactionInfo.name;

  const transactionCategory = document.createElement("td");
  transactionCategory.classList.add("category-column");

  transactionCategory.textContent = transaction.categorie.nom;
  transactionCategory.dataset.categoryId = transaction.categorieId;

  const transactionDescription = document.createElement("td");
  transactionDescription.textContent = transaction.description;

  const transactionAccount = document.createElement("td");
  transactionAccount.classList.add("account-column");

  const transactionAmount = document.createElement("td");
  transactionAmount.classList.add(transactionInfo.class, "amount-column");

  const accountColumn = {};
  if (transaction.type === "TRANSFER") {
    accountColumn.accountDebited = document.createElement("span");

    accountColumn.accountDebited.textContent =
      transaction.montant > 0
        ? transaction.destinationAccount.nom
        : transaction.compte.nom;
    accountColumn.downwardArror = document.createElement("span");
    accountColumn.downwardArror.classList.add("downward-arrow");
    accountColumn.downwardArror.textContent = "↓";

    accountColumn.accountTransfered = document.createElement("span");
    accountColumn.accountTransfered.textContent =
      transaction.montant > 0
        ? transaction.compte.nom
        : transaction.destinationAccount.nom;

    transactionAmount.textContent = Math.abs(transaction.montant);
  } else {
    accountColumn.accountConcerned = document.createElement("span");
    accountColumn.accountConcerned.textContent = transaction.compte.nom;
    transactionAmount.textContent = transaction.montant;
  }
  // this is only for styling reasons
  const accountsContainer = document.createElement("div");

  for (const key in accountColumn) {
    accountsContainer.appendChild(accountColumn[key]);
  }
  transactionAccount.appendChild(accountsContainer);

  const actionBtns = document.createElement("td");
  actionBtns.classList.add("action-btns");
  actionBtns.innerHTML = editIcon + deleteIcon;

  tableRow.append(
    transactionDate,
    transactionType,
    transactionCategory,
    transactionDescription,
    transactionAccount,
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
  transactionData.type = getTxTypeByText(
    getTransactionTypeInfo,
    currentTd.querySelector("span").textContent,
  );

  currentTd = currentTd.nextSibling;
  transactionData.categoryName = currentTd.textContent;
  transactionData.categoryId = currentTd.dataset.categoryId;

  currentTd = currentTd.nextSibling;
  transactionData.description = currentTd.textContent;

  currentTd = currentTd.nextSibling;
  // this is account td i guess no need for it now

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

// tx stands for transaction

function getTxTypeByText(object, text) {
  return Object.keys(object).find((key) => object[key].name === text);
}

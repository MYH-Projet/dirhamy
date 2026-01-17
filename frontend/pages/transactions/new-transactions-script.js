import { displayToast } from "../../components/toast.js";
import {
  loadInitialStructure,
  deleteIcon,
  editIcon,
  fetchAndRender,
  API_URL,
  submitActionEntity,
  showDeleteEntityModal,
  toastNotis,
} from "../../utils/utils.js";

const user = {};

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

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getAccountBalances(user);
  fetchAndRenderAddTransactionContainer(user);
  getTransactions();
  toastNotis();
});

// setting up events
wireTableEvents();
wireAddContainerEvents();

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
  return fetchAndRender(API_URL + "/transactions/user", renderTransactions);
}

function renderTransactions(transactions) {
  transactions = transactions.data;
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
  transactionType.textContent = getTransactionTypeName[transaction.type];

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
  return fetch(API_URL + "/categories").then((res) =>
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
}

function wireTableEvents() {
  const tbody = document.querySelector("table.list-entity-container tbody");

  tbody.addEventListener("click", (e) => {
    const editIconBehavior = checkTransactionIconClick(
      tbody,
      e.target,
      "edit-icon",
    );
    const deleteIconBehavior = checkTransactionIconClick(
      tbody,
      e.target,
      "delete-icon",
    );

    if (editIconBehavior.isClicked) {
      showEditTransactionModal(editIconBehavior);
    } else if (deleteIconBehavior.isClicked) {
      showDeleteTransactionModal(deleteIconBehavior);
    }
  });
}

function wireAddContainerEvents() {
  document.querySelector("#add-type-field").addEventListener("change", (e) => {
    const transferToField = document.querySelector("#add-transfer-to-field");
    if (e.target.value === "TRANSFER") {
      transferToField.style.display = "block";
    } else {
      transferToField.style.display = "none";
    }
  });

  document.querySelector("#add-entity-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = {
      montant: document.querySelector("#add-amount-field").value,
      type: document.querySelector("#add-type-field").value,
      description: document.querySelector("#add-description-field").value,
      compteId: document.querySelector("#add-account-field").value,
      categoryId: document.querySelector("#add-category-field").value,
      idDestination: document.querySelector("#add-transfer-to-field").value,
    };
    submitActionEntity(API_URL + "/transactions", fields, refreshPage, "POST");
    e.target.reset();
  });
}
function showEditTransactionModal(transaction) {
  return fetchAndRender(API_URL + "/categories", (categories) => {
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.nom;
      document.querySelector("#edit-category-field").append(option);
    });
  }).then(() => {
    const modalBackground = document.querySelector(".modal-background");
    const editModal = document.querySelector(".edit-transaction-modal");
    const newModal = editModal.cloneNode(true);

    const dateField = editModal.querySelector("#edit-date-field");
    dateField.value = transaction.date;
    const typeField = editModal.querySelector("#edit-type-field");
    typeField.value = transaction.type;
    const categoryField = editModal.querySelector("#edit-category-field");
    categoryField.value = transaction.categoryId;
    const descriptionField = editModal.querySelector("#edit-description.field");
    descriptionField.value = transaction.description;
    const amountField = editModal.querySelector("#edit-amount-field");
    amountField.value = transaction.amount;

    modalBackground.style.display = "block";
    editModal.style.display = "block";

    editModal.addEventListener("submit", (e) => {
      e.preventDefault();

      if (e.submitter.classList.contains("action-btn")) {
        const newFields = {
          montant: amountField.value,
          description: descriptionField.value,
          categoryId: categoryField.value,
        };
        submitEditTransaction(transaction.id, newFields);
      } else if (e.submitter.classList.contains("cancel-btn")) {
      }

      modalBackground.style.display = "none";
      editModal.style.display = "none";

      editModal.parentElement.replaceChild(newModal, editModal);
    });
  });
}

function submitEditTransaction(transactionId, newFields) {
  return submitActionEntity(
    API_URL + "/transactions/" + transactionId,
    newFields,
    refreshPage,
    "PUT",
  );
}

function showDeleteTransactionModal(transaction) {
  showDeleteEntityModal("transaction", transaction.id, submitDeleteTransaction);
}

function submitDeleteTransaction(transactionId) {
  return submitActionEntity(
    API_URL + "/transactions/" + transactionId,
    null,
    refreshPage,
    "DELETE",
  );
}

function refreshPage() {
  return Promise.all([getAccountBalances(), getTransactions()]);
}
function checkTransactionIconClick(table, node, className) {
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

function getNeededTransactionData(tableRow) {
  const transactionData = {};

  let currentTd = tableRow.firstChild;
  transactionData.id = tableRow.dataset.id;
  transactionData.date = currentTd.textContent;

  currentTd = currentTd.nextSibling;
  transactionData.type = getKeyByValue(
    getTransactionTypeName,
    currentTd.textContent,
  );

  currentTd = currentTd.nextSibling;
  transactionData.categoryName = currentTd.textContent;
  transactionData.categoryId = currentTd.dataset.categoryId;

  currentTd = currentTd.nextSibling;
  transactionData.amount = Math.abs(+currentTd.textContent);

  return transactionData;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

import {
  loadInitialStructure,
  deleteIcon,
  editIcon,
  fetchAndRender,
  API_URL,
  submitActionEntity,
  showDeleteEntityModal,
  toastNotis,
  safeApiFetch,
  removeStopOverlay,
  switchToProcess,
  closeModal,
  closeModalsAndRemoveEvents,
} from "../../utils/utils.js";
import { displayToast } from "../../components/toast.js";

/*
  Very important thing for future myself or different collaborator,
  Backend accepts full iso date, while date local time input only goes to seconds
  we would be only taking date input from the user up to minutes which would improve usabiliy, 
  but reduces accuracy
  this compromise is acceptable for the current app just bear in mind we send to backend full isoString
  and only show trimmedIsoDate(its a function)
  (another thing i'm only showing the date (y,m,d) in the table that's why i'm storing the minutes and seconds as 
  data attribute)
*/

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
      safeApiFetch(API_URL + "/balance?compteId=" + account.id).then((data) => {
        account.balance = data.finalBalance;
      }),
    );
  });

  return Promise.all(promises).then(() => {
    renderAccounts(user);
  });
}

function renderAccounts(user) {
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

function getTransactions() {
  return fetchAndRender(API_URL + "/transactions/user", renderTransactions);
}

function renderTransactions(transactions) {
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

function createTransactionRow(transaction) {
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

function fetchAndRenderAddTransactionContainer(user) {
  return safeApiFetch(API_URL + "/categories").then((data) => {
    const selectAccount = document.querySelector("#add-account-field");
    const selectAccountToField = document.querySelector(
      "#add-transfer-to-field",
    );

    const date = trimIsoDateToInput(new Date().toISOString());

    document.querySelector("#add-date-field").value = date;

    user.accounts.forEach((account) => {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = account.nom;
      selectAccount.append(option);
      selectAccountToField.append(option.cloneNode(true));
    });

    const selectCategory = document.querySelector("#add-category-field");
    data.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.nom;
      selectCategory.append(option);
    });

    // Verify that if value is on transfer on load show the transfer field
    const transferToUnit = document.querySelector(
      ".add-entity-container .form-unit:has(#add-transfer-to-field)",
    );
    if (document.querySelector("#add-type-field").value === "TRANSFER") {
      transferToUnit.style.display = "block";
    } else {
      transferToUnit.style.display = "none";
    }
  });
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
    const transferToUnit = document.querySelector(
      ".add-entity-container .form-unit:has(#add-transfer-to-field)",
    );
    if (e.target.value === "TRANSFER") {
      transferToUnit.style.display = "block";
    } else {
      transferToUnit.style.display = "none";
    }
  });

  document.querySelector(".add-entity-form").addEventListener("submit", (e) => {
    e.preventDefault();
    switchToProcess(e.submitter);
    const fields = {
      montant: +document.querySelector("#add-amount-field").value,
      date: new Date(
        document.querySelector("#add-date-field").value,
      ).toISOString(),
      type: document.querySelector("#add-type-field").value,
      description: document.querySelector("#add-description-field").value,
      compteId: +document.querySelector("#add-account-field").value,
      categorieId: +document.querySelector("#add-category-field").value,
      idDestination: +document.querySelector("#add-transfer-to-field").value,
    };
    submitActionEntity(
      API_URL + "/transactions",
      fields,
      refreshPage,
      "POST",
    ).finally(() => {
      removeStopOverlay(e.submitter, "Add");
      e.target.reset();
    });
  });
}
function showEditTransactionModal(transaction) {
  return fetchAndRender(API_URL + "/categories", (categories) => {
    // here you should keep a state to not refetch categories each time espicially when its a multi page app
    document.querySelector("#edit-category-field").innerHTML = "";
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
    dateField.value = trimIsoDateToInput(transaction.date);
    const typeField = editModal.querySelector("#edit-type-field");
    typeField.value = transaction.type;
    const categoryField = editModal.querySelector("#edit-category-field");
    categoryField.value = transaction.categoryId;
    const descriptionField = editModal.querySelector("#edit-description-field");
    descriptionField.value = transaction.description;
    const amountField = editModal.querySelector("#edit-amount-field");
    amountField.value = transaction.amount;

    modalBackground.classList.add("switch-on-modal");
    editModal.classList.add("switch-on-modal");

    // THIS USES EDITMODAL AS A MORE GLOBAL SCOPE VAR BE CAREFUL
    const enableSumbitFn = (e) => {
      e.preventDefault();
      const actionBtn = editModal.querySelector(".action-btn");

      if (!actionBtn.disabled) {
        editModal.removeEventListener("input", enableSumbitFn);
      } else {
        actionBtn.disabled = false;
      }
    };
    editModal.addEventListener("input", enableSumbitFn);

    editModal.addEventListener("submit", (e) => {
      e.preventDefault();
      switchToProcess(e.submitter);

      if (e.submitter.classList.contains("action-btn")) {
        const newFields = {
          montant: +amountField.value,
          description: descriptionField.value,
          date: new Date(dateField.value).toISOString(),
          categorieId: +categoryField.value,
        };
        submitEditTransaction(transaction.id, newFields).finally(() => {
          closeModalsAndRemoveEvents(
            editModal,
            modalBackground,
            newModal,
            e.submitter,
          );
        });
      } else if (e.submitter.classList.contains("cancel-btn")) {
        closeModalsAndRemoveEvents(
          editModal,
          modalBackground,
          newModal,
          e.submitter,
        );
      }
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
  return Promise.all([getAccountBalances(user), getTransactions()]);
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

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

function trimIsoDateToInput(dateString) {
  const array = dateString.split(":");
  array.pop();
  return array.join(":");
}

import {
  loadInitialStructure,
  fetchAndRender,
  API_URL,
  submitActionEntity,
  toastNotis,
  safeApiFetch,
  switchToProcess,
  removeSpinnerPage,
  cancelSwitchToProcess,
  trimIsoDateToInput,
  adaptTime,
} from "/helpers/utils.js";
import { showEditEntityModal, showDeleteEntityModal } from "/helpers/modals.js";
import {
  renderAccounts,
  renderTransactions,
  checkTransactionIconClick,
} from "/ui/transaction-ui.js";

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

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  Promise.all([
    getAccountBalances(user),
    fetchAndRenderAddTransactionContainer(user),
    getTransactions(),
  ]).then(() => {
    removeSpinnerPage();
    toastNotis();
  });
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

function getTransactions() {
  return fetchAndRender(API_URL + "/transactions/user", renderTransactions);
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
  const addTransactionForm = document.querySelector(".add-entity-form");
  const addTypeField = addTransactionForm.querySelector("#add-type-field");
  const transferToUnit = document.querySelector(
    ".add-entity-container .form-unit:has(#add-transfer-to-field)",
  );

  addTypeField.addEventListener("change", (e) => {
    if (e.target.value === "TRANSFER") {
      transferToUnit.style.display = "block";
    } else {
      transferToUnit.style.display = "none";
    }
  });

  addTransactionForm.addEventListener("reset", (e) => {
    e.preventDefault();
    document.querySelector("#add-amount-field").value = "";
    document.querySelector("#add-description-field").value = "";
    addTypeField.value = "DEPENSE";
    transferToUnit.style.display = "none";
  });
  addTransactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    switchToProcess(e.submitter);
    const fields = {
      montant: +document.querySelector("#add-amount-field").value,
      date: adaptTime(document.querySelector("#add-date-field").value),
      type: addTypeField.value,
      description: document.querySelector("#add-description-field").value,
      compteId: +document.querySelector("#add-account-field").value,
      categorieId: +document.querySelector("#add-category-field").value,
      idDestination: +transferToUnit.querySelector("#add-transfer-to-field")
        .value,
    };
    submitActionEntity(
      API_URL + "/transactions",
      fields,
      refreshPage,
      "POST",
    ).finally(() => {
      cancelSwitchToProcess(e.submitter, "Add");

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
    const editTransactionBehaviour = {
      entity: transaction,
      modal: document.querySelector(".edit-transaction-modal"),
      fields: {
        date: document.querySelector("#edit-date-field"),
        type: document.querySelector("#edit-type-field"),
        category: document.querySelector("#edit-category-field"),
        description: document.querySelector("#edit-description-field"),
        amount: document.querySelector("#edit-amount-field"),
      },
      fillFields: function () {
        this.fields.date.value = trimIsoDateToInput(this.entity.date);
        this.fields.type.value = this.entity.type;
        this.fields.category.value = this.entity.categoryId;
        this.fields.description.value = this.entity.description;
        this.fields.amount.value = this.entity.amount;
      },
      getApiFields: function () {
        let trueDate;
        if (trimIsoDateToInput(this.entity.date) === this.fields.date.value) {
          trueDate = this.entity.date;
        } else {
          trueDate = adaptTime(this.fields.date.value);
        }
        return {
          montant: +this.fields.amount.value,
          description: this.fields.description.value,
          date: trueDate,
          categorieId: +this.fields.category.value,
        };
      },
      submitModal: function () {
        return submitEditTransaction(this.entity.id, this.getApiFields());
      },
    };
    showEditEntityModal(editTransactionBehaviour);
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

const transferIdTreated = [];
function adaptTransactions(transactions) {
  const allInfoNeeded = {
    array: [],
    transactionsNeedTransferEquivalent: [],
  };
  let found = false;
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].type === "TRANSFER" && transactions[i].isTreated) {
      continue;
    } else if (transactions[i].type === "TRANSFER") {
      for (let j = i + 1; i < transactions.length; i++) {
        if (transactions[i].transferId === transactions[j].transferId) {
          transactions[i].account2 = transactions[j].compte;
          transactions[j].isTreated = true;
          found = true;
        }
      }
      if (found == false) {
        transactionsNeedTransferEquivalent.push(transactions[i]);
        continue;
      }
    }
    allInfoNeeded.array.push(transactions[i]);
  }
  return allInfoNeeded;
}

function getTransactionsTest(
  finalArray = [],
  cursor = null,
  firstCall = true,
  needsMoreCalls = false,
) {
  while (
    (finalArray.length < 10 && (!cursor === null || firstCall)) ||
    needsMoreCalls
  ) {
    let url = cursor
      ? API_URL + "/transactions/user?cursor=" + cursor
      : API_URL + "/transactions/user";

    return safeApiFetch(url).then((data) => {
      const infoNeeded = adaptTransactions(data.data);
      finalArray = [...finalArray, ...infoNeeded.array];

      cursor = data.meta.nextCursor;
      return getTransactionsTest(finalArray, cursor, false);
    });
  }
  return { transactions: finalArray, cursor: cursor };
}

getTransactionsTest().then((data) => console.log(data));

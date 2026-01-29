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
  appendTransactionsToTable,
} from "/ui/transaction-ui.js";

/*
  TO DO
  Improve show more mechanism


*/

const user = {};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  Promise.all([
    getAccountBalances(user),
    fetchAndRenderAddTransactionContainer(user),
    getTransactions(user),
  ]).then(() => {
    removeSpinnerPage();
    toastNotis();
  });
});

// setting up events
wireTableEvents();
wireAddContainerEvents();

document.querySelector("#show-more-btn").addEventListener("click", (e) => {
  // i assume it will not be enabled if there is no more data but i will check anyway
  const btnDataset = e.target.dataset;
  if (btnDataset.cursor) {
    switchToProcess(e.target);
    getAndAppendTransactions(user, btnDataset.cursor).finally(() => {
      cancelSwitchToProcess(e.target, "Show more");
      // disabling btn if no more transactions
      if (btnDataset.cursor) {
        e.target.disabled = false;
      } else {
        e.target.disabled = true;
      }
    });
  }
});

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
  for (const prop of Object.getOwnPropertyNames(transferTransactionsTreated)) {
    delete transferTransactionsTreated[prop];
  }
  return Promise.all([getAccountBalances(user), getTransactions(user)]);
}

const transferTransactionsTreated = {};

function adaptTransactionsList(user, list) {
  for (let i = 0; i < list.length; i++) {
    let transaction = list[i];

    if (
      transaction.type === "TRANSFER" &&
      !transferTransactionsTreated[transaction.transferId]
    ) {
      // this works because we guarantee that a user's transfer is to an account that belongs to the user
      transaction.destinationAccount = user.accounts.find(
        (account) => account.id === transaction.idDestination,
      );
      transferTransactionsTreated[transaction.transferId] = true;
    } else if (
      transaction.type === "TRANSFER" &&
      transferTransactionsTreated[transaction.transferId]
    ) {
      list.splice(i, 1);
      i--;
    }
  }

  return list;
}

function getTransactions(user, cursor, list = []) {
  let url = API_URL + "/transactions/user";
  url = cursor ? url + "?cursor=" + cursor : url;

  return safeApiFetch(url).then((data) => {
    let result = adaptTransactionsList(user, data.data);
    list = [...list, ...result];

    if (list.length >= 10 || !data.hasMore) {
      return renderTransactions(list, data.meta.nextCursor);
    }
    return getTransactions(user, data.meta.nextCursor, list);
  });
}

function getAndAppendTransactions(user, cursor, list = []) {
  let url = API_URL + "/transactions/user";
  url = cursor ? url + "?cursor=" + cursor : url;

  return safeApiFetch(url).then((data) => {
    let result = adaptTransactionsList(user, data.data);
    list = [...list, ...result];

    if (list.length >= 10 || !data.hasMore) {
      return appendTransactionsToTable(list, data.meta.nextCursor);
    }
    return getTransactions(user, data.meta.nextCursor, list);
  });
}

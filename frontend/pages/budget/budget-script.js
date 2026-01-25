import {
  loadInitialStructure,
  fetchAndRender,
  API_URL,
  submitActionEntity,
  toastNotis,
  switchToProcess,
  removeSpinnerPage,
} from "/helpers/utils.js";
import {
  showEditEntityModal,
  showDeleteEntityModal,
  closeModalsAndRemoveEvents,
} from "/helpers/modals.js";

import { renderBudgetStatuses } from "/ui/budget-ui.js";

const user = {};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getBudgetStatuses().then(() => {
    removeSpinnerPage();
    toastNotis();
  });
});

const currentDate = new Date();
document.querySelector(".header-text p").textContent +=
  " " + months[currentDate.getMonth()] + " " + currentDate.getFullYear();

document
  .querySelector(".add-budget-limit-btn")
  .addEventListener("click", (e) => {
    fetchAndRender(API_URL + "/categories", showSetLimitModal);
  });

// Functions from now on
function getBudgetStatuses() {
  return fetchAndRender(
    API_URL + "/budget/status",
    renderBudgetStatuses,
    wireBudgetCardEvents,
  );
}

function showEditLimitModal(budgetStatus) {
  const editLimitModalBehavior = {
    entity: budgetStatus,
    modal: document.querySelector(".edit-budget-modal"),
    fields: {
      limit: document.querySelector("#edit-category-limit-field"),
      categoryName: document.querySelector("#category-name-field"),
    },
    fillFields: function () {
      this.fields.limit.value = this.entity.limit;
      this.fields.categoryName.value = this.entity.categoryName;
    },
    getApiFields: function () {
      return {
        categoryId: this.entity.categoryId,
        limit: this.fields.limit.value,
      };
    },
    submitModal: function () {
      return submitSetLimit(this.getApiFields());
    },
  };
  showEditEntityModal(editLimitModalBehavior);
}

// switch this to generic function when needed
function showSetLimitModal(categories) {
  const modalBackground = document.querySelector(".modal-background");
  const setLimitModal = document.querySelector(".add-budget-modal");
  const selectElement = setLimitModal.querySelector("#category-choices");

  // to remove event listener and reset form
  const newCleanModal = setLimitModal.cloneNode(true);
  newCleanModal.reset();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.nom;
    selectElement.append(option);
  });

  modalBackground.classList.add("switch-on-modal");
  setLimitModal.classList.add("switch-on-modal");

  setLimitModal.addEventListener("submit", (e) => {
    e.preventDefault();

    switchToProcess(e.submitter);
    if (e.submitter.classList.contains("action-btn")) {
      const fields = {
        categoryId: selectElement.value,
        limit: setLimitModal.querySelector("#add-category-limit-field").value,
      };
      submitSetLimit(fields).finally(() => {
        closeModalsAndRemoveEvents(
          setLimitModal,
          modalBackground,
          newCleanModal,
          e.submitter,
        );
      });
    } else if (e.submitter.classList.contains("cancel-btn")) {
      closeModalsAndRemoveEvents(
        setLimitModal,
        modalBackground,
        newCleanModal,
        e.submitter,
      );
    }
  });
}
function showDeleteLimitModal(budgetStatus) {
  showDeleteEntityModal("budget", budgetStatus.categoryId, submitDeleteLimit);
}

function wireBudgetCardEvents() {
  Array.from(document.querySelectorAll(".budget-card .action-btns")).forEach(
    (actionBtn) => {
      actionBtn.addEventListener("click", (e) => {
        const editIconBehavior = checkCategoryIconClick(
          actionBtn,
          e.target,
          "edit-icon",
        );
        const deleteIconBehavior = checkCategoryIconClick(
          actionBtn,
          e.target,
          "delete-icon",
        );

        const budgetStatus = {
          categoryId: +actionBtn.dataset.id,
          categoryName: actionBtn.dataset.name,
          limit: +actionBtn.dataset.limit,
        };
        if (editIconBehavior.isClicked) {
          showEditLimitModal(budgetStatus);
        } else if (deleteIconBehavior.isClicked) {
          showDeleteLimitModal(budgetStatus);
        }
      });
    },
  );
}

function submitSetLimit(fields) {
  return submitActionEntity(
    API_URL + "/budget/limit",
    fields,
    getBudgetStatuses,
    "POST",
  );
}
function submitDeleteLimit(categoryId) {
  return submitActionEntity(
    API_URL + "/budget/limit/" + categoryId,
    null,
    getBudgetStatuses,
    "DELETE",
  );
}

export function checkCategoryIconClick(table, node, className) {
  const svg = node.closest("svg");

  const res = {
    isClicked: null,
    entityId: null,
  };
  if (!svg) {
    res.isClicked = false;
    return res;
  }
  if (!table.contains(svg)) {
    res.isClicked = false;
    return res;
  }

  if (svg.classList.contains(className)) {
    res.isClicked = true;
    return res;
  } else {
    res.isClicked = false;
    return res;
  }
}

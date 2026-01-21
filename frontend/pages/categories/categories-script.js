/*
  VERY IMPORTANT TODOS
    add rerendering logic on fail fetching user if its not done already

    refactor this 'res.ok -> toast' logic in a function if possible

    maybe refactor the removeeventlistener logic its too much repetition
*/

import { displayToast } from "../../components/toast.js";
import {
  loadInitialStructure,
  deleteIcon,
  editIcon,
  API_URL,
  fetchAndRender,
  showDeleteEntityModal,
  submitActionEntity,
  switchToProcess,
  removeStopOverlay,
  closeModalsAndRemoveEvents,
  toastNotis,
  removeSpinner,
  showEditEntityModal,
} from "../../utils/utils.js";

const user = {};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getCategories().then(() => {
    removeSpinner();
    toastNotis();
  });
});

wireTableEvents();

document.querySelector(".add-entity-form").addEventListener("submit", (e) => {
  e.preventDefault();
  switchToProcess(e.submitter);
  const nameFormField = document.querySelector("#name-form-field");

  submitActionEntity(
    API_URL + "/categories",
    {
      nom: nameFormField.value,
    },
    getCategories,
    "POST",
  ).finally(() => {
    removeStopOverlay(e.submitter, "Add");
    e.target.reset();
  });
});

function getCategories() {
  return fetchAndRender(API_URL + "/categories", renderCategories);
}

function renderCategories(categories) {
  const tableBody = document.querySelector("table.list-entity-container tbody");

  tableBody.innerHTML = "";

  categories.forEach((category) => {
    const tableRow = createCategoryRow(category);
    tableBody.appendChild(tableRow);
  });
}

function wireTableEvents() {
  const tableBody = document.querySelector("table.list-entity-container tbody");
  tableBody.addEventListener("click", (e) => {
    const editIconBehavior = checkCategoryIconClick(
      tableBody,
      e.target,
      "edit-icon",
    );
    const deleteIconBehavior = checkCategoryIconClick(
      tableBody,
      e.target,
      "delete-icon",
    );

    if (editIconBehavior.isClicked) {
      showEditCategoryModal({
        nom: editIconBehavior.categoryName,
        id: editIconBehavior.entityId,
      });
    } else if (deleteIconBehavior.isClicked) {
      showDeleteCategoryModal({
        nom: deleteIconBehavior.categoryName,
        id: deleteIconBehavior.entityId,
      });
    }
  });
}
function createCategoryRow(category) {
  const tableRow = document.createElement("tr");
  const categoryName = document.createElement("td");
  categoryName.textContent = category.nom;

  const actionBtnsRow = document.createElement("td");
  actionBtnsRow.classList.add("action-btns");
  actionBtnsRow.dataset.id = category.id;

  actionBtnsRow.innerHTML = editIcon + deleteIcon;

  tableRow.append(categoryName, actionBtnsRow);
  return tableRow;
}

function showEditCategoryModal(category) {
  const editCategoryModalBehavior = {
    entity: category,
    modal: document.querySelector(".edit-category-modal"),
    fields: {
      name: document.querySelector("#category-name-field"),
    },
    fillFields: function () {
      this.fields.name.value = this.entity.nom;
    },
    getApiFields: function () {
      return {
        nom: this.fields.name.value,
      };
    },
    submitModal: function () {
      return submitEditCategory(this.entity.id, this.getApiFields());
    },
  };
  showEditEntityModal(editCategoryModalBehavior);
}

function submitEditCategory(categoryId, newCategoryFields) {
  return submitActionEntity(
    API_URL + "/categories/" + categoryId,
    newCategoryFields,
    getCategories,
    "PUT",
  );
}

function showDeleteCategoryModal(category) {
  showDeleteEntityModal("category", category.id, submitDeleteCategory);
}

function submitDeleteCategory(categoryId) {
  return submitActionEntity(
    API_URL + "/categories/" + categoryId,
    null,
    getCategories,
    "DELETE",
  );
}

function checkCategoryIconClick(table, node, className) {
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
    res.entityId = +svg.parentElement.dataset.id;
    res.categoryName = svg.parentElement.previousSibling.textContent;
    return res;
  } else {
    res.isClicked = false;
    return res;
  }
}

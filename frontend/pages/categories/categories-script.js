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
} from "../../utils/utils.js";

const user = {};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getCategories();
});

wireTableEvents();

document.querySelector(".add-entity-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const nameFormField = document.querySelector("#name-form-field");

  submitActionEntity(
    API_URL + "/categories",
    {
      nom: nameFormField.value,
    },
    getCategories,
    "POST",
  );

  e.target.reset();
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
  const modalBackground = document.querySelector(".modal-background");
  const editModal = document.querySelector(".edit-category-modal");

  const nameField = editModal.querySelector("#category-name-field");

  nameField.value = category.nom;

  modalBackground.classList.add("switch-on-modal");
  editModal.classList.add("switch-on-modal");

  // THIS USES EDITMODAL AS A MORE GLOBAL SCOPE VAR BE CAREFUL
  const enableSumbitFn = (e) => {
    e.preventDefault();
    const actionBtn = editModal.querySelector(".action-btn");

    if (!actionBtn.disabled) {
      editModal.removeEventListener(enableSumbitFn);
    } else {
      actionBtn.disabled = false;
    }
  };
  editModal.addEventListener("input", enableSumbitFn);

  editModal.addEventListener("submit", (e) => {
    e.preventDefault();

    modalBackground.classList.remove("switch-on-modal");
    editModal.classList.remove("switch-on-modal");

    if (e.submitter.classList.contains("action-btn")) {
      const newCategoryFields = {
        nom: nameField.value,
      };
      submitEditCategory(category, newCategoryFields);

      editModal.parentElement.replaceChild(
        editModal.cloneNode(true),
        editModal,
      );
    } else if (e.submitter.classList.contains("cancel-btn")) {
      // remove the event listener, to try using removeEventListener later
      editModal.parentElement.replaceChild(
        editModal.cloneNode(true),
        editModal,
      );
    }
  });
}

function submitEditCategory(category, newCategoryFields) {
  return submitActionEntity(
    API_URL + "/categories/" + category.id,
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
    API_URL + "/categories" + categoryId,
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

import {
  loadInitialStructure,
  fetchAndRender,
  API_URL,
  submitActionEntity,
  toastNotis,
  switchToProcess,
  removeSpinnerPage,
  cancelSwitchToProcess,
} from "/helpers/utils.js";
import { showEditEntityModal, showDeleteEntityModal } from "/helpers/modals.js";
import { renderCategories } from "/ui/category-ui.js";

const user = {};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getCategories().then(() => {
    removeSpinnerPage();
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
    cancelSwitchToProcess(e.submitter, "Add");
    e.target.reset();
  });
});

function getCategories() {
  return fetchAndRender(API_URL + "/categories", renderCategories);
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

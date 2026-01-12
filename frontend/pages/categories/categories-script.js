import {
  loadInitialStructure,
  deleteIcon,
  editIcon,
  API_URL,
} from "../../utils/utils.js";

const user = {};

// Create Initial Structure and populate the user object
loadInitialStructure(user).then(() => {
  // write your code here
  getCategories();
});

function getCategories() {
  return fetch(API_URL + "/categories")
    .then((res) => res.json())
    .then((data) => renderCategories(data));
}

function renderCategories(categories) {
  const tableBody = document.querySelector("table.list-entity-container tbody");
  categories.forEach((category) => {
    const tableRow = document.createElement("tr");
    const categoryName = document.createElement("td");
    categoryName.textContent = category.nom;

    const actionBtnsRow = document.createElement("td");
    actionBtnsRow.classList.add("action-btns");
    actionBtnsRow.dataset.id = category.id;

    actionBtnsRow.innerHTML = editIcon + deleteIcon;

    tableRow.append(categoryName, actionBtnsRow);
    tableBody.appendChild(tableRow);
  });
  tableBody.addEventListener("click", (e) => {
    const editIconBehavior = chechIconClick(tableBody, e.target, "edit-icon");
    const deleteIconBehavior = chechIconClick(
      tableBody,
      e.target,
      "delete-icon"
    );

    if (editIconBehavior.isClicked) {
      showEditCategoryModal(
        categories.find((category) => category.id === editIconBehavior.entityId)
      );
    } else if (deleteIconBehavior.isClicked) {
      showDeleteCategoryModal(
        categories.find(
          (category) => category.id === deleteIconBehavior.entityId
        )
      );
    }
  });
}

function chechIconClick(table, node, className) {
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
    return res;
  } else {
    res.isClicked = false;
    return res;
  }
}

function showEditCategoryModal(category) {
  const modalBackground = document.querySelector(".modal-background");
  const editModal = document.querySelector(".edit-category-modal");

  editModal.querySelector("#category-name-field").value = category.nom;

  modalBackground.style.display = "block";
  editModal.style.display = "block";

  editModal.addEventListener("submit", (e) => {
    e.preventDefault();

    if (e.submitter.classList.contains("action-btn")) {
    } else if (e.submitter.classList.contains("cancel-btn")) {
      removeEditCategoryModal(category, modalBackground, editModal);
    }
  });
}
function removeEditCategoryModal(category, modalBackground, editModal) {
  modalBackground.style.display = "none";
  editModal.style.display = "none";
  editModal.querySelector("#category-name-field").value = "";

  // This is to remove the previous event listeners, there is another way to try later
  editModal.parentElement.replaceChild(editModal.cloneNode(true), editModal);
}
function showDeleteCategoryModal(category) {
  const modalBackground = document.querySelector(".modal-background");
  const deleteModal = document.querySelector(".delete-category-modal");
  modalBackground.style.display = "block";
  deleteModal.style.display = "block";
}
function removeDeleteCategoryModal(category) {}

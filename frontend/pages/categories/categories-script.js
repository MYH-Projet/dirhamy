import { displayToast } from "../../components/toast.js";
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

  /*
  This is good if we have a lot of fields i kept it here for future reference but now its just overhead
  you just pass in fields instead of just nameField
  const fields = {
    nom : editIcon.querySelector("#category-name-field"),
  }
  */
  const nameField = editModal.querySelector("#category-name-field");

  nameField.value = category.nom;

  modalBackground.style.display = "block";
  editModal.style.display = "block";

  editModal.addEventListener("submit", (e) => {
    e.preventDefault();

    if (e.submitter.classList.contains("action-btn")) {
      submitEditCategoryModel(category, modalBackground, editModal, nameField);
    } else if (e.submitter.classList.contains("cancel-btn")) {
      cancelEditCategoryModel(category, modalBackground, editModal, nameField);
    }
  });
}

function submitEditCategoryModel(
  category,
  modalBackground,
  editModal,
  nameField
) {
  return fetch(API_URL + "/categories" + "/" + category.id, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      nom: nameField.value,
    }),
  }).then((res) =>
    res.json().then((data) => {
      modalBackground.style.display = "none";
      editModal.style.display = "none";
      nameField.value = "";

      if (res.ok) {
        return getCategories().then(() => {
          displayToast(
            document.querySelector(".toasts-container"),
            "Category modified with success",
            "success"
          );
        });
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          data.message || data.error,
          "error"
        );
      }
    })
  );
}
function cancelEditCategoryModel(
  category,
  modalBackground,
  editModal,
  nameField
) {
  modalBackground.style.display = "none";
  editModal.style.display = "none";
  nameField.value = "";

  // This is to remove the previous event listeners, there is another way to try later .removeEventListener
  editModal.parentElement.replaceChild(editModal.cloneNode(true), editModal);
}
function showDeleteCategoryModal(category) {
  const modalBackground = document.querySelector(".modal-background");
  const deleteModal = document.querySelector(".delete-category-modal");
  modalBackground.style.display = "block";
  deleteModal.style.display = "block";
}
function removeDeleteCategoryModal(category) {}

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

  tableBody.innerHTML = "";

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
  you use fields object if we have a lot to manage
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

    modalBackground.style.display = "none";
    editModal.style.display = "none";

    if (e.submitter.classList.contains("action-btn")) {
      const newCategoryFields = {
        nom: nameField.value,
      };
      submitEditCategory(category, newCategoryFields);
    } else if (e.submitter.classList.contains("cancel-btn")) {
      // remove the event listener, to try using removeEventListener later
      editModal.parentElement.replaceChild(
        editModal.cloneNode(true),
        editModal
      );
    }

    nameField.value = "";
  });
}

function submitEditCategory(category, newCategoryFields) {
  return fetch(API_URL + "/categories/" + category.id, {
    method: "PUT",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(newCategoryFields),
  }).then((res) =>
    res.json().then((data) => {
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
          /* right now i want to see the backend message of error if its not good change it to a normal default message*/
          data.message || data.error,
          "error"
        );
      }
    })
  );
}

function showDeleteCategoryModal(category) {
  const modalBackground = document.querySelector(".modal-background");
  const deleteModal = document.querySelector(".delete-category-modal");
  modalBackground.style.display = "block";
  deleteModal.style.display = "block";

  deleteModal.addEventListener("submit", (e) => {
    e.preventDefault();

    modalBackground.style.display = "none";
    deleteModal.style.display = "none";

    if (e.submitter.classList.contains("delete-btn")) {
      submitDeleteCategory(category);
    } else if (e.submitter.classList.contains("cancel-btn")) {
      // Again removing the eventlistener
      editModal.parentElement.replaceChild(
        deleteModal.cloneNode(true),
        deleteModal
      );
    }
  });
}

function submitDeleteCategory(category) {
  return fetch(API_URL + "/categories/" + category.id, {
    method: "DELETE",
    headers: {
      "Content-type": "application/json",
    },
  }).then((res) =>
    res.json().then((data) => {
      if (res.ok) {
        return getCategories().then(() =>
          displayToast(
            document.querySelector(".toasts-container"),
            "Success deleting that category",
            "success"
          )
        );
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          /* right now i want to see the backend message of error if its not good change it to a normal default message*/
          data.error || data.message,
          "error"
        );
      }
    })
  );
}

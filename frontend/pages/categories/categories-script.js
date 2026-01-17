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
  fetch(API_URL + "/categories/", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      nom: nameFormField.value,
    }),
  }).then((res) =>
    res.json().then((data) => {
      nameFormField.value = "";
      if (res.ok) {
        document
          .querySelector("table.list-entity-container tbody")
          .appendChild(createCategoryRow(data));

        displayToast(
          document.querySelector(".toasts-container"),
          "Adding category was successful",
          "success",
        );
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          data.error || data.message,
          "error",
        );
      }
    }),
  );
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

  /*
  This is good if we have a lot of fields i kept it here for future reference but now its just overhead
  you use fields object if we have a lot to manage
  const fields = {
    nom : editIcon.querySelector("#category-name-field"),
  }

  i wish i could separate the showing of modal from the event wiring but the modal is linked 
  to a certain category state/value and so i have to know which category to submit and i'll be able 
  to have only one event listener, 
  i could use local storage to get the data to change but it will be slow plus i'll have 
  to hanndle deleting the local storage after leaving the page
  the other way is global variables which is nice it works and i think its fine to change it but 
  now is this way better vs global variables? that's to think about later 
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

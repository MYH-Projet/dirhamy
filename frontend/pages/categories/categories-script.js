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
    actionBtnsRow.innerHTML = editIcon + deleteIcon;

    tableRow.append(categoryName, actionBtnsRow);
    tableBody.appendChild(tableRow);
  });
}

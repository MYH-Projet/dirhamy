import { deleteIcon, editIcon } from "/ui/common-ui.js";

export function renderCategories(categories) {
  const tableBody = document.querySelector("table.list-entity-container tbody");

  tableBody.innerHTML = "";

  categories.forEach((category) => {
    const tableRow = createCategoryRow(category);
    tableBody.appendChild(tableRow);
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

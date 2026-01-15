import {
  API_URL,
  editIcon,
  deleteIcon,
  loadInitialStructure,
} from "../../utils/utils.js";
import { displayToast } from "../../components/toast.js";

const user = {};

const warningIcon = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <circle cx="8.5" cy="8.5" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8.5 5v4M8.5 11v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>`;
const goodIcon = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <circle cx="8.5" cy="8.5" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M5 8.5l2.5 2.5L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>`;
const onTrackIcon = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M2 13L6.5 8.5L9.5 10.5L15 4M15 4h-4M15 4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>`;
const overIcon = warningIcon;

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
  getBudgetStatuses();
});

const currentDate = new Date();
document.querySelector(".header-text p").textContent +=
  " " + months[currentDate.getMonth()] + " " + currentDate.getFullYear();

document
  .querySelector(".add-budget-limit-btn")
  .addEventListener("click", (e) => {
    fetchAndShowSetLimitModal();
  });

// Functions from now on
function getBudgetStatuses() {
  return (
    fetch(API_URL + "/budget/status")
      .then((res) => res.json())
      // double check if data is object that hold data arrayso data.data or data array directly
      .then((data) => renderBudgetStatuses(data))
  );
}

function renderBudgetStatuses(budgetStatuses) {
  const budgetListContainer = document.querySelector(".list-budget-limits");

  budgetListContainer.innerHTML = "";
  budgetStatuses.forEach((budgetStatus) => {
    const budgetCard = createBudgetCard(budgetStatus);
    budgetListContainer.appendChild(budgetCard);
  });
}

function createBudgetCard(budgetStatus) {
  const budgetCard = document.createElement("article");
  budgetCard.classList.add("card", "primary-card", "budget-card");

  const cardHeader = document.createElement("div");
  cardHeader.classList.add("budget-card-header");

  const categoryName = document.createElement("h2");
  categoryName.classList.add("budget-card-category");
  categoryName.textContent = budgetStatus.categoryName;

  const actionBtns = document.createElement("div");
  actionBtns.classList.add("action-btns");
  actionBtns.innerHTML = editIcon + deleteIcon;
  actionBtns.dataset.id = budgetStatus.categoryId;

  cardHeader.append(categoryName, actionBtns);

  const cardAmounts = document.createElement("p");
  cardAmounts.classList.add("budget-card-amounts");

  const spentAmount = document.createElement("strong");
  spentAmount.classList.add("spent-amount");
  spentAmount.textContent = budgetStatus.spent.toFixed(2) + " DH";

  const separatationDot = document.createElement("strong");
  separatationDot.classList.add("middot");
  separatationDot.innerHTML = "&middot;";

  const limitAmount = document.createElement("strong");
  limitAmount.classList.add("limit-amount");
  limitAmount.textContent = budgetStatus.limit.toFixed(2) + " DH";

  // this is wrong find a way to do it with appendChild or sanitize input to prevent xss
  cardAmounts.innerHTML = `Spent: ${spentAmount.outerHTML} ${separatationDot.outerHTML} 
  Limit: ${limitAmount.outerHTML}`;

  const budgetPercentage = Math.abs(budgetStatus.percentage.toFixed(2));
  const classes = budgetPercentages(budgetPercentage);

  const progressBar = document.createElement("div");
  progressBar.classList.add("budget-progress-bar");

  const progressUsed = document.createElement("div");
  progressUsed.classList.add("progress-used", classes.progressUsedClass);
  progressUsed.style.flex = budgetPercentage / 100;

  const progressLeft = document.createElement("div");
  progressLeft.classList.add("progress-left");
  progressLeft.style.flex = 1 - budgetPercentage / 100;

  progressBar.append(progressUsed, progressLeft);

  const cardStats = document.createElement("div");
  cardStats.classList.add("budget-card-stats");
  const percentageUsed = document.createElement("p");
  percentageUsed.classList.add("percentage-used");
  percentageUsed.textContent = budgetPercentage + "%";
  const amountRemaining = document.createElement("p");
  amountRemaining.classList.add("amount-left");
  amountRemaining.textContent = budgetStatus.remaining + " DH";
  cardStats.append(percentageUsed, amountRemaining);

  const cardMessage = document.createElement("p");
  cardMessage.classList.add("budget-card-message", classes.cardMessageClass);

  cardMessage.innerHTML = classes.cardIcon;
  const message = document.createElement("span");
  message.textContent = classes.cardMessage;
  cardMessage.append(message);

  budgetCard.append(
    cardHeader,
    cardAmounts,
    progressBar,
    cardStats,
    cardMessage
  );

  return budgetCard;
}
function fetchAndShowSetLimitModal() {
  fetch(API_URL + "/categories")
    .then((res) => res.json())
    .then((data) => {
      showSetLimitModal(data);
    });
}

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

  modalBackground.style.display = "block";
  setLimitModal.style.display = "block";

  setLimitModal.addEventListener("submit", (e) => {
    e.preventDefault();

    if (e.submitter.classList.contains("action-btn")) {
      const fields = {
        categoryId: selectElement.value,
        limit: setLimitModal.querySelector("#add-category-limit-field").value,
      };
      submitSetLimit(fields);
      setLimitModal.parentElement.replaceChild(newCleanModal, setLimitModal);
    } else if (e.submitter.classList.contains("cancel-btn")) {
      // remove event listener
      setLimitModal.parentElement.replaceChild(newCleanModal, setLimitModal);
    }
    modalBackground.style.display = "none";
    setLimitModal.style.display = "none";
  });
}

function submitSetLimit(fields) {
  fetch(API_URL + "/budget/limit", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(fields),
  }).then((res) =>
    res.json().then((data) => {
      if (res.ok) {
        return getBudgetStatuses().then(
          displayToast(
            document.querySelector(".toasts-container"),
            data.message,
            "success"
          )
        );
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

function budgetPercentages(percentage) {
  const suffixProgress = "progress-used";
  const suffixMessage = "budget-status";
  if (percentage < 51) {
    return {
      progressUsedClass: "good-" + suffixProgress,
      cardMessageClass: "good-" + suffixMessage,
      cardIcon: goodIcon,
      cardMessage: `Doing great`,
    };
  } else if (percentage < 81) {
    return {
      progressUsedClass: "on-track-" + suffixProgress,
      cardMessageClass: "on-track-" + suffixMessage,
      cardIcon: onTrackIcon,
      cardMessage: `On track`,
    };
  } else if (percentage <= 100) {
    return {
      progressUsedClass: "warning-" + suffixProgress,
      cardMessageClass: "warning-" + suffixMessage,
      cardIcon: warningIcon,
      cardMessage: `Warning`,
    };
  } else {
    return {
      progressUsedClass: "over-" + suffixProgress,
      cardMessageClass: "over-" + suffixMessage,
      cardIcon: overIcon,
      cardMessage: `Over budget`,
    };
  }
}

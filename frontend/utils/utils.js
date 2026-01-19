import {
  insertSidebar,
  focusCurrentSidebarLink,
} from "../components/sidebar.js";
import { displayToast } from "../components/toast.js";

export const API_URL = "/api";

function renderInitialStucture(user) {
  return insertSidebar(document.querySelector("body")).then(() => {
    focusCurrentSidebarLink();
    document.querySelector(".user-name").textContent =
      user.name + " " + user.surname;
    document.querySelector(".sidebar-profile-icon").textContent =
      user.name[0].toUpperCase() + user.surname[0].toUpperCase();
  });
}

export function loadInitialStructure(user) {
  return safeApiFetch(API_URL + "/profile").then((data) => {
    user.id = data.user.id;
    user.name = data.user.prenom;
    user.surname = data.user.nom;
    user.accounts = data.acconts;
    return renderInitialStucture(user);
  });
}

export function fetchAndRender(url, renderCallback) {
  return safeApiFetch(url).then((data) => {
    renderCallback(data);
  });
}

export function submitActionEntity(url, newFields, refreshCallback, verb) {
  return safeApiFetch(url, {
    method: verb,
    headers: {
      "Content-type": "application/json",
    },
    // even if delete its fine since the backend doesn't read the body and you're sending empty body
    body: JSON.stringify(newFields || { data: "" }),
  }).then((data) => {
    return refreshCallback().then(
      displayToast(
        document.querySelector(".toasts-container"),
        data.message || "Success",
        "success",
      ),
    );
  });
}
export function toastNotis() {
  const toast = JSON.parse(sessionStorage.getItem("toast"));
  if (toast) {
    displayToast(
      document.querySelector(".toasts-container"),
      toast.message,
      toast.type,
    );
    sessionStorage.removeItem("toast");
  }
}

export function showDeleteEntityModal(modalName, entityId, submitCallback) {
  const modalBackground = document.querySelector(".modal-background");
  const deleteModal = document.querySelector(`.delete-${modalName}-modal`);
  const newModal = deleteModal.cloneNode(true);

  modalBackground.classList.add("switch-on-modal");
  deleteModal.classList.add("switch-on-modal");

  deleteModal.addEventListener("submit", (e) => {
    e.preventDefault();
    switchToProcess(e.submitter);

    if (e.submitter.classList.contains("delete-btn")) {
      submitCallback(entityId).finally(() => {
        closeModalsAndRemoveEvents(
          deleteModal,
          modalBackground,
          newModal,
          e.submitter,
        );
      });
    } else if (e.submitter.classList.contains("cancel-btn")) {
      closeModalsAndRemoveEvents(
        deleteModal,
        modalBackground,
        newModal,
        e.submitter,
      );
    }
  });
}

export function safeApiFetch(url, parameterObject) {
  return fetch(url, parameterObject).then((res) => {
    return res
      .json()
      .then((data) => {
        if (res.ok) {
          return data;
        } else if (res.status === 401) {
          sessionStorage.setItem(
            "toast",
            JSON.stringify({
              type: "error",
              message: "Logged out",
            }),
          );
          window.location.replace("../login/login.html");
        } else {
          throw Error(data.message || data.error);
        }
      })
      .catch((err) => {
        displayToast(
          document.querySelector(".toasts-container"),
          err.message,
          "error",
        );
      });
  });
}

export function switchToProcess(btn) {
  btn.textContent = "Processing...";
  btn.disabled = true;
  const stopOverlay = document.createElement("div");
  stopOverlay.classList.add("pause-page-overlay");
  document.querySelector("body").append(stopOverlay);
}
export function removeStopOverlay(btn, btnOriginalText) {
  btn.textContent = btnOriginalText;
  btn.disabled = false;
  document.querySelector(".pause-page-overlay").remove();
}

export function closeModal(modal, modalBackground, actionBtn) {
  let originalText = "";
  if (actionBtn.classList.contains("cancel-btn")) {
    originalText = "Cancel";
  } else if (actionBtn.classList.contains("action-btn")) {
    originalText = "Save";
  } else if (actionBtn.classList.contains("delete-btn")) {
    originalText = "Delete";
  }
  removeStopOverlay(actionBtn, originalText);
  modal.classList.remove("switch-on-modal");
  modalBackground.classList.remove("switch-on-modal");
}

export function closeModalsAndRemoveEvents(
  modal,
  modalBackground,
  newModal,
  btn,
) {
  modal.parentElement.replaceChild(newModal, modal);
  closeModal(newModal, modalBackground, btn);
}

export const editIcon = `<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const deleteIcon = `<svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="10" y1="11" x2="10" y2="17" stroke-linecap="round" />
  <line x1="14" y1="11" x2="14" y2="17" stroke-linecap="round" />
</svg>`;

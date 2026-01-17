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
  return fetch(API_URL + "/profile")
    .then((res) => res.json())
    .then((data) => {
      user.id = data.user.id;
      user.name = data.user.prenom;
      user.surname = data.user.nom;
      user.accounts = data.acconts;
      return renderInitialStucture(user);
    });
}

export function fetchAndRender(url, renderCallback) {
  return fetch(url)
    .then((res) =>
      res.json().then((data) => {
        if (res.ok) {
          renderCallback(data);
        } else {
          throw Error(data.error || data.message);
        }
      }),
    )
    .catch((err) => {
      // Add more redirecting logic later

      displayToast(
        document.querySelector(".toasts-container"),
        err.message,
        "error",
      );
    });
}

export function submitActionEntity(url, newFields, refreshCallback, verb) {
  fetch(url, {
    method: verb,
    headers: {
      "Content-type": "application/json",
    },
    // even if delete its fine since the backend doesn't read the body and you're sending null
    body: JSON.stringify(newFields),
  }).then((res) =>
    res.json().then((data) => {
      if (res.ok) {
        return refreshCallback().then(
          displayToast(
            document.querySelector(".toasts-container"),
            data.message,
            "success",
          ),
        );
      } else {
        displayToast(
          document.querySelector(".toasts-container"),
          data.message || data.error,
          "error",
        );
      }
    }),
  );
}

export function showDeleteEntityModal(modalName, entityId, submitCallback) {
  const modalBackground = document.querySelector(".modal-background");
  const deleteModal = document.querySelector(`.delete-${modalName}-modal`);
  const newModal = deleteModal.cloneNode(true);

  modalBackground.style.display = "block";
  deleteModal.style.display = "block";

  deleteModal.addEventListener("submit", (e) => {
    e.preventDefault();

    if (e.submitter.classList.contains("delete-btn")) {
      submitCallback(entityId);
    } else if (e.submitter.classList.contains("cancel-btn")) {
    }

    modalBackground.style.display = "none";
    deleteModal.style.display = "none";

    deleteModal.parentElement.replaceChild(newModal, deleteModal);
  });
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

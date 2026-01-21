import { renderInitialStucture } from "../ui/common-ui.js";
import { displayToast } from "../components/toast.js";

export const API_URL = "/api";

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

export function showEditEntityModal(editModal) {
  const modalBackground = document.querySelector(".modal-background");

  const newCleanModal = editModal.modal.cloneNode(true);
  newCleanModal.reset();

  modalBackground.classList.add("switch-on-modal");
  editModal.modal.classList.add("switch-on-modal");

  editModal.fillFields();

  // THIS USES Modal AS A MORE GLOBAL SCOPE VAR BE CAREFUL
  const enableSumbitFn = (e) => {
    e.preventDefault();
    const actionBtn = editModal.modal.querySelector(".action-btn");

    if (!actionBtn.disabled) {
      editModal.modal.removeEventListener("input", enableSumbitFn);
    } else {
      actionBtn.disabled = false;
    }
  };
  editModal.modal.addEventListener("input", enableSumbitFn);

  editModal.modal.addEventListener("submit", (e) => {
    e.preventDefault();

    switchToProcess(e.submitter);
    if (e.submitter.classList.contains("cancel-btn")) {
      // i could use a promise.resolve to only write this once but this is simple enough to be fine
      closeModalsAndRemoveEvents(
        editModal.modal,
        modalBackground,
        newCleanModal,
        e.submitter,
      );
    } else if (e.submitter.classList.contains("action-btn")) {
      editModal.submitModal().finally(() => {
        closeModalsAndRemoveEvents(
          editModal.modal,
          modalBackground,
          newCleanModal,
          e.submitter,
        );
      });
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
        } else if (res.status === 401 || res.status === 403) {
          sessionStorage.setItem(
            "toast",
            JSON.stringify({
              type: "error",
              message: data.error || data.message,
            }),
          );
          window.location.replace("../login/login.html");
        } else {
          let errorToSend = [{ message: "Some type of error" }];
          if (data.error) {
            errorToSend = [{ message: data.error }];
          } else if (data.errors) {
            errorToSend = data.errors;
          }
          throw Error(JSON.stringify(errorToSend));
        }
      })
      .catch((err) => {
        JSON.parse(err.message).forEach((error) => {
          displayToast(
            document.querySelector(".toasts-container"),
            error.message,
            "error",
          );
        });
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

export function removeSpinner() {
  const overlay = document.querySelector(".loading-overlay");
  overlay.classList.add("no-opacity");
  setTimeout(() => {
    overlay.remove();
  }, 100);
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

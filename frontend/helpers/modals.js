import { switchToProcess, cancelSwitchToProcess } from "./utils.js";

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

export function closeModal(modal, modalBackground, actionBtn) {
  let originalText = "";
  if (actionBtn.classList.contains("cancel-btn")) {
    originalText = "Cancel";
  } else if (actionBtn.classList.contains("action-btn")) {
    originalText = "Save";
  } else if (actionBtn.classList.contains("delete-btn")) {
    originalText = "Delete";
  }
  cancelSwitchToProcess(actionBtn, originalText);
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

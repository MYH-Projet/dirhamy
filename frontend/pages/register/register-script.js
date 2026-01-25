import { displayToast } from "../../components/toast.js";
import {
  toastNotis,
  switchToProcess,
  cancelSwitchToProcess,
  safeApiFetch,
} from "../../helpers/utils.js";

const API_URL = "/api";

const toastContainer = document.querySelector(".toasts-container");

document.querySelector(".copyright-year").textContent =
  new Date().getFullYear();

toastNotis();

document.querySelector(".login-form").addEventListener("submit", (e) => {
  e.preventDefault();

  if (validatePasswordMatching()) {
    switchToProcess(e.submitter);

    safeApiFetch(API_URL + "/auth/register", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        nom: document.querySelector("#form-last-name-input").value,
        prenom: document.querySelector("#form-first-name-input").value,
        mail: document.querySelector("#form-mail-input").value,
        password: document.querySelector("#form-pass-input").value,
      }),
    })
      .then((data) => {
        displayToast(toastContainer, data.message, "success");
      })
      .finally(() => {
        cancelSwitchToProcess(e.submitter, "Sign up");
      });
    e.target.reset();
  } else {
    displayToast(toastContainer, "Passwords don't match", "error");
  }
});

function validatePasswordMatching() {
  return (
    document.querySelector("#form-pass-input").value ===
    document.querySelector("#form-confirm-pass-input").value
  );
}

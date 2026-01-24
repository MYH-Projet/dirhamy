import { displayToast } from "../../components/toast.js";
import {
  API_URL,
  toastNotis,
  switchToProcess,
  cancelSwitchToProcess,
  safeApiFetch,
} from "../../helpers/utils.js";

const boxes = {
  login: document.querySelector(".login-box"),
  register: document.querySelector(".register-box"),
  forgotPass: document.querySelector(".forgot-pass-box"),
  verifyCode: document.querySelector(".verify-code-box"),
  resetPass: document.querySelector(".reset-pass-box"),
};

const pageNameToTitle = {
  login: "Login",
  register: "Register",
  forgotPass: "Forgot Password",
  verifyCode: "Verify Code",
  resetPass: "Reset Password",
};

showPage("login");

const toastContainer = document.querySelector(".toasts-container");

document.querySelector(".copyright-year").textContent =
  new Date().getFullYear();

toastNotis();

function changePageTitle(page) {
  const title = pageNameToTitle[page];
}

// Switch to classes
function disableAllBoxes() {
  for (const box in boxes) {
    boxes[box].style.display = "none";
  }
}
function showPage(page) {
  disableAllBoxes();
  changePageTitle(page);
  boxes[page].style.display = "flex";
}

function wirePageTransitionEvents() {}

document
  .querySelector(".login-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    switchToProcess(e.submitter);

    safeApiFetch(API_URL + "/auth/login", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        mail: document.querySelector("#login-mail-input").value,
        password: document.querySelector("#login-pass-input").value,
      }),
    }).then((data) => {
      sessionStorage.setItem(
        "toast",
        JSON.stringify({ type: "success", message: data.message }),
      );
      window.location.replace("../transactions/transactions.html");
    });
  })
  .finally(() => {
    cancelSwitchToProcess(e.submitter, "Sign in");
  });

document
  .querySelector(".register-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    if (validatePasswordMatching()) {
      switchToProcess(e.submitter);

      safeApiFetch(API_URL + "/auth/register", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          nom: document.querySelector("#register-last-name-input").value,
          prenom: document.querySelector("#register-first-name-input").value,
          mail: document.querySelector("#register-mail-input").value,
          password: document.querySelector("#register-pass-input").value,
        }),
      })
        .then((data) => {
          showPage("login");
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

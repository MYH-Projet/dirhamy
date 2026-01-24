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

const hrefToPage = {
  "/login": "login",
  "/register": "register",
  "/forgot-password": "forgotPass",
  "/verify-code": "verifyCode",
  "/reset-password": "resetPass",
};

showPage("login");

const toastContainer = document.querySelector(".toasts-container");

document.querySelector(".copyright-year").textContent =
  new Date().getFullYear();

toastNotis();

wirePageTransitionEvents();

function changePageTitle(page) {
  document.title = pageNameToTitle[page];
}

// Switch to classes
function disableAllBoxes() {
  for (const box in boxes) {
    boxes[box].style.display = "none";
  }
}
function showPage(page) {
  if (page === "verifyCode") {
    if (!sessionStorage.getItem("reset-mail")) {
      showPage("forgotPass");
      displayToast(
        toastContainer,
        "No mail was found, please try again",
        "error",
      );
      return;
    }
  }
  disableAllBoxes();
  changePageTitle(page);
  boxes[page].style.display = "flex";
}

function wirePageTransitionEvents() {
  document.querySelectorAll(".box-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const form = link.closest("form");

      showPage(hrefToPage[link.pathname]);

      form.reset();
    });
  });
}

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
    })
      .then((data) => {
        sessionStorage.setItem(
          "toast",
          JSON.stringify({ type: "success", message: data.message }),
        );
        window.location.replace("../transactions/transactions.html");
      })
      .finally(() => {
        cancelSwitchToProcess(e.submitter, "Sign in");
      });
  });

document
  .querySelector(".register-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    if (validatePasswordMatching("register")) {
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
          e.target.reset();
        });
    } else {
      displayToast(toastContainer, "Passwords don't match", "error");
    }
  });

document
  .querySelector(".forgot-pass-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    switchToProcess(e.submitter);

    const resetMail = document.querySelector("#forgot-pass-mail-input").value;

    safeApiFetch(API_URL + "/auth/forgetpassword", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        mail: resetMail,
      }),
    })
      .then((data) => {
        document.querySelector(".verify-code-box > .box-text").textContent =
          "Email Sent. Please enter your verification code.";
        sessionStorage.setItem("reset-mail", resetMail);
        showPage("verifyCode");
      })
      .finally(() => {
        cancelSwitchToProcess(e.submitter, "Send");
        e.target.reset();
      });
  });

document
  .querySelector(".verify-code-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    switchToProcess(e.submitter);

    safeApiFetch(API_URL + "/auth/checkCode", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        mail: sessionStorage.getItem("reset-mail"),
        code: document.querySelector("#verify-code-input").value,
      }),
    })
      .then((data) => {
        showPage("resetPass");
        displayToast(toastContainer, data.message, "success");
      })
      .finally(() => {
        cancelSwitchToProcess(e.submitter, "Send");
        e.target.reset();
      });
  });

document
  .querySelector(".reset-pass-box .box-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    if (validatePasswordMatching("resetPass")) {
      switchToProcess(e.submitter);

      safeApiFetch(API_URL + "/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          password: document.querySelector("#reset-pass-input").value,
        }),
      })
        .then((data) => {
          showPage("login");
          displayToast(toastContainer, data.message, "success");
        })
        .finally(() => {
          cancelSwitchToProcess(e.submitter, "Send");
          e.target.reset();
        });
    } else {
      displayToast(toastContainer, "Passwords don't match", "error");
    }
  });

function validatePasswordMatching(page) {
  if (page === "register") {
    return (
      document.querySelector("#register-pass-input").value ===
      document.querySelector("#register-confirm-pass-input").value
    );
  } else if (page === "resetPass") {
    return (
      document.querySelector("#reset-pass-input").value ===
      document.querySelector("#reset-confirm-pass-input").value
    );
  }
}

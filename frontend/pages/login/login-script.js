import { displayToast } from "/components/toast.js";
import {
  API_URL,
  toastNotis,
  switchToProcess,
  cancelSwitchToProcess,
  safeApiFetch,
  getKeyByValue,
} from "/helpers/utils.js";

const showPassEye = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Eye outline -->
  <path
    d="M12 64c14-22 34-36 52-36s38 14 52 36c-14 22-34 36-52 36S26 86 12 64z"
    fill="none"
    stroke="currentColor"
    stroke-width="6"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Iris -->
  <circle
    cx="64"
    cy="64"
    r="14"
    fill="none"
    stroke="currentColor"
    stroke-width="6"
  />
</svg>`;

const hidePassEye = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Eye outline -->
  <path
    d="M12 64c14-22 34-36 52-36s38 14 52 36c-14 22-34 36-52 36S26 86 12 64z"
    fill="none"
    stroke="currentColor"
    stroke-width="6"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Iris -->
  <circle
    cx="64"
    cy="64"
    r="14"
    fill="none"
    stroke="currentColor"
    stroke-width="6"
  />

  <!-- Slash -->
  <line
    x1="32"
    y1="32"
    x2="96"
    y2="96"
    stroke="currentColor"
    stroke-width="6"
    stroke-linecap="round"
  />
</svg>`;

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

injectShowPassEye();
wirePasswordVisibility();

showPage(hrefToPage[window.location.pathname]);

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
  // changes uri without reloading
  history.replaceState(null, "", getKeyByValue(hrefToPage, page));
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
        window.location.replace("/transactions");
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

function injectShowPassEye() {
  document.querySelectorAll('input[type="password"]').forEach((element) => {
    const div = document.createElement("div");
    div.classList.add("toggle-pass-visibility");
    div.innerHTML = showPassEye;
    element.parentElement.append(div);
  });
}

function wirePasswordVisibility() {
  document.querySelectorAll(".form-pass-input").forEach((element) => {
    element.addEventListener("click", (e) => {
      if (checkIconClick(element, e.target)) {
        element
          .closest("form")
          .querySelectorAll(".form-pass-input")
          .forEach((container) => {
            const input = container.firstElementChild;
            container.removeChild(container.lastElementChild);
            if (input.type === "password") {
              const div = document.createElement("div");
              div.classList.add("toggle-pass-visibility");
              div.innerHTML = hidePassEye;
              container.appendChild(div);
              input.type = "text";
              input.placeholder = "password123";
            } else {
              const div = document.createElement("div");
              div.classList.add("toggle-pass-visibility");
              div.innerHTML = showPassEye;
              container.appendChild(div);
              input.type = "password";
              input.placeholder = "••••••";
            }
          });
      }
    });
  });
}

function checkIconClick(element, targetClicked) {
  const icon = targetClicked.closest(".toggle-pass-visibility");

  if (icon) {
    if (element.contains(icon)) {
      return true;
    }
  }
  return false;
}

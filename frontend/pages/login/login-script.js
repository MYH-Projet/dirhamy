import { displayToast } from "../../components/toast.js";

const API_URL = "/api";

const toastContainer = document.querySelector(".toasts-container");

const loginForm = document.querySelector(".login-form");

const mailInput = document.querySelector("#form-mail-input");
const passInput = document.querySelector("#form-pass-input");

const toast = JSON.parse(sessionStorage.getItem("toast"));
if (toast) {
  displayToast(toastContainer, toast.message, toast.type);
  sessionStorage.removeItem("toast");
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  fetch(API_URL + "/auth/login", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      mail: mailInput.value,
      password: passInput.value,
    }),
  })
    .then((res) => {
      return res.json().then((data) => {
        if (res.ok) {
          sessionStorage.setItem(
            "toast",
            JSON.stringify({ type: "success", message: data.message })
          );
          window.location.replace("../transactions/transactions.html");
        } else {
          throw Error(data.error);
        }
      });
    })
    .catch((err) => {
      displayToast(toastContainer, err.message, "error");
    });
});

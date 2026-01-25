import { renderInitialStucture } from "/ui/common-ui.js";
import { displayToast } from "/components/toast.js";

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

export function fetchAndRender(url, renderCallback, eventWire) {
  return safeApiFetch(url).then((data) => {
    renderCallback(data);
    if (eventWire) {
      eventWire();
    }
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
    return refreshCallback().then(() => {
      displayToast(
        document.querySelector(".toasts-container"),
        data.message || "Success",
        "success",
      );
    });
  });
}

export function safeApiFetch(url, parameterObject) {
  return fetch(url, parameterObject).then((res) => {
    return res
      .json()
      .then((data) => {
        console.log(res);
        if (res.ok) {
          return data;
        } else if (res.status === 401 || res.status === 403) {
          sessionStorage.setItem(
            "toast",
            JSON.stringify({
              type: "error",
              message: data.error || data.message || "Logged out",
            }),
          );
          window.location.replace("/login");
          return Promise.reject();
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
        // i could rethrow the error but would it stop execution anyway to be verified
        return Promise.reject();
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
export function cancelSwitchToProcess(btn, btnOriginalText) {
  btn.textContent = btnOriginalText;
  btn.disabled = false;
  document.querySelector(".pause-page-overlay").remove();
}

export function removeSpinnerPage() {
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

export function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

export function trimIsoDateToInput(dateString) {
  const array = dateString.split("T");
  return array[0];
}

function getTimeToday() {
  const todayFirstDate = new Date(trimIsoDateToInput(new Date().toISOString()));
  return Date.now() - todayFirstDate.getTime();
}

export function adaptTime(inputDate) {
  const inputTime = new Date(inputDate).getTime();
  const todayTime = getTimeToday();
  return new Date(inputTime + todayTime).toISOString();
}

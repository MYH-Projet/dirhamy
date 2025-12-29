import {
  insertSidebar,
  disableCurrentSidebarLink,
} from "../components/sidebar.js";

const API_URL = "/api";

function renderInitialStucture(user) {
  return insertSidebar(document.querySelector("body")).then(() => {
    disableCurrentSidebarLink();
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

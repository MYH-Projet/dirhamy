import { insertSidebar, focusCurrentSidebarLink } from "/components/sidebar.js";

export const editIcon = `<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const deleteIcon = `<svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="10" y1="11" x2="10" y2="17" stroke-linecap="round" />
  <line x1="14" y1="11" x2="14" y2="17" stroke-linecap="round" />
</svg>`;

export function renderInitialStucture(user) {
  return insertSidebar(document.querySelector("body")).then(() => {
    focusCurrentSidebarLink();
    document.querySelector(".user-name").textContent =
      user.name + " " + user.surname;
    document.querySelector(".sidebar-profile-icon").textContent =
      user.name[0].toUpperCase() + user.surname[0].toUpperCase();
  });
}

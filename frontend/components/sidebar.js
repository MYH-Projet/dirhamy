import { API_URL, safeApiFetch } from "/helpers/utils.js";

const hamburgerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><line x1="0" y1="3" x2="32" y2="3" stroke="#18212c" stroke-width="3" stroke-linecap="round"/><line x1="0" y1="12" x2="32" y2="12" stroke="#18212c" stroke-width="3" stroke-linecap="round"/><line x1="0" y1="21" x2="32" y2="21" stroke="#18212c" stroke-width="3" stroke-linecap="round"/></svg>`;

const transactionIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polyline points="4,7 14,7 11,4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="14" y1="7" x2="14" y2="7" stroke="currentColor" stroke-width="2"/><polyline points="20,17 10,17 13,20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const categoryIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 12V3h9l9 9-9 9-9-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>`;

const budgetIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" stroke-linejoin="round"/><path d="M16 3v4M8 3v4M2 11h20" stroke-linecap="round"/></svg>`;

const chatbotIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-linejoin="round"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M9 14s1 1 3 1 3-1 3-1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const disconnectIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 3h8v18H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><polyline points="14,12 20,12 17,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="20" y1="12" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.classList.add("sidebar");

  // the async stuff
  let promises = [];

  // Header specific stuff
  const sidebarHeader = document.createElement("div");
  sidebarHeader.classList.add("sidebar-header");

  promises.push(
    fetch("/icons/logo.svg")
      .then((res) => res.text())
      .then((text) => {
        sidebarHeader.innerHTML = text;
        const btn = document.createElement("button");
        btn.classList.add("sidebar-resize-btn");
        btn.innerHTML = hamburgerIcon;
        sidebarHeader.appendChild(btn);
        btn.addEventListener("click", (e) => {
          sidebar.classList.toggle("sidebar-collapsed");
          document
            .querySelector(".main-container")
            .classList.toggle("main-container-expanded");

          const timeout = sidebar.classList.contains("sidebar-collapsed")
            ? 140
            : 60;

          setTimeout(() => {
            sidebar.classList.toggle("sidebar-collapsed-later");
          }, timeout);
        });
      }),
  );

  sidebar.append(sidebarHeader);

  // nav/body specific stuff
  const sidebarNav = document.createElement("nav");
  sidebarNav.classList.add("sidebar-nav");
  const list = document.createElement("ul");

  const listItemOne = document.createElement("li");
  listItemOne.classList.add("sidebar-link");
  const anchorOne = document.createElement("a");
  anchorOne.id = "transactions-link";
  anchorOne.href = "/transactions";

  anchorOne.innerHTML = transactionIcon;
  const spanOne = document.createElement("span");
  spanOne.textContent = "Transactions";
  anchorOne.appendChild(spanOne);
  listItemOne.appendChild(anchorOne);
  list.appendChild(listItemOne);

  const listItemTwo = document.createElement("li");
  listItemTwo.classList.add("sidebar-link");
  const anchorTwo = document.createElement("a");
  anchorTwo.href = "/categories";
  anchorTwo.id = "categories-link";

  anchorTwo.innerHTML = categoryIcon;
  const spanTwo = document.createElement("span");
  spanTwo.textContent = "Categories";
  anchorTwo.appendChild(spanTwo);

  listItemTwo.appendChild(anchorTwo);
  list.appendChild(listItemTwo);

  const listItemThree = document.createElement("li");
  listItemThree.classList.add("sidebar-link");
  const anchorThree = document.createElement("a");
  anchorThree.href = "/budget";
  anchorThree.id = "budget-link";

  anchorThree.innerHTML = budgetIcon;
  const spanThree = document.createElement("span");
  spanThree.textContent = "Budget";
  anchorThree.appendChild(spanThree);

  listItemThree.appendChild(anchorThree);
  list.appendChild(listItemThree);

  const listItemFour = document.createElement("li");
  listItemFour.classList.add("sidebar-link");
  const anchorFour = document.createElement("a");
  anchorFour.href = "/chatbot";
  anchorFour.id = "chatbot-link";

  anchorFour.innerHTML = chatbotIcon;
  const spanFour = document.createElement("span");
  spanFour.textContent = "Chatbot";
  anchorFour.appendChild(spanFour);

  listItemFour.appendChild(anchorFour);
  list.appendChild(listItemFour);

  sidebarNav.appendChild(list);
  sidebar.append(sidebarNav);

  // footer specific stuff
  const sidebarFooter = document.createElement("div");
  sidebarFooter.classList.add("sidebar-footer");

  const sidebarProfile = document.createElement("div");
  sidebarProfile.classList.add("sidebar-profile");

  const sidebarProfileIcon = document.createElement("div");
  sidebarProfileIcon.classList.add("sidebar-profile-icon");
  sidebarProfileIcon.textContent = "";

  const userName = document.createElement("p");
  userName.classList.add("user-name");
  userName.textContent = "";

  sidebarProfile.append(sidebarProfileIcon, userName);

  const disconnectBtn = document.createElement("button");
  disconnectBtn.classList.add("sidebar-disconnect");

  disconnectBtn.innerHTML = disconnectIcon;
  const disconectSpan = document.createElement("span");
  disconectSpan.textContent = "Disconnect";
  disconnectBtn.appendChild(disconectSpan);

  disconnectBtn.addEventListener("click", (e) => {
    safeApiFetch(API_URL + "/auth/logout", {
      method: "POST",
    }).then((data) => {
      sessionStorage.setItem(
        "toast",
        JSON.stringify({ type: "success", message: "Logout sucessful" }),
      );
      window.location.replace("/login");
    });
  });

  sidebarFooter.append(sidebarProfile, disconnectBtn);

  sidebar.append(sidebarFooter);

  return {
    promises: promises,
    sidebar: sidebar,
  };
}

export function insertSidebar(container) {
  // can i just document.appendchild dashboard and not body .appendchild if styles on dashboard is fixed
  const sidebarStatus = createSidebar();
  return Promise.all(sidebarStatus.promises).then(() => {
    container.appendChild(sidebarStatus.sidebar);
  });
}

export function focusCurrentSidebarLink() {
  const currentPage = window.location.pathname.slice(1);

  const anchorLink = document.querySelector("#" + currentPage + "-link");

  anchorLink.classList.add("current-link");
}

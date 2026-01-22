function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.classList.add("sidebar");

  // the async stuff
  let promises = [];

  // Header specific stuff
  const sidebarHeader = document.createElement("div");
  sidebarHeader.classList.add("sidebar-header");

  promises.push(
    fetch("./icons/logo.svg")
      .then((res) => res.text())
      .then((text) => {
        sidebarHeader.innerHTML = text;
        const btn = document.createElement("button");
        btn.classList.add("sidebar-resize-btn");
        promises.push(
          fetch("./icons/sidebar-icons/hamburger-icon.svg")
            .then((res) => res.text())
            .then((text) => {
              btn.innerHTML = text;
              sidebarHeader.appendChild(btn);
            })
        );
      })
  );

  sidebar.append(sidebarHeader);

  // nav/body specific stuff
  const sidebarNav = document.createElement("nav");
  sidebarNav.classList.add("sidebar-nav");
  const list = document.createElement("ul");

  const listItemOne = document.createElement("li");
  listItemOne.classList.add("sidebar-link");
  const anchorOne = document.createElement("a");
  anchorOne.href = "./transactions.html";

  promises.push(
    fetch("./icons/sidebar-icons/transactions-icon.svg")
      .then((res) => res.text())
      .then((text) => {
        anchorOne.innerHTML = text;
        const span = document.createElement("span");
        span.textContent = "Transactions";
        anchorOne.appendChild(span);
      })
  );
  listItemOne.appendChild(anchorOne);
  list.appendChild(listItemOne);

  const listItemTwo = document.createElement("li");
  listItemTwo.classList.add("sidebar-link");
  const anchorTwo = document.createElement("a");
  anchorTwo.href = "./categories.html";

  promises.push(
    fetch("./icons/sidebar-icons/categories-icon.svg")
      .then((res) => res.text())
      .then((text) => {
        anchorTwo.innerHTML = text;
        const span = document.createElement("span");
        span.textContent = "Categories";
        anchorTwo.appendChild(span);
      })
  );
  listItemTwo.appendChild(anchorTwo);
  list.appendChild(listItemTwo);

  const listItemThree = document.createElement("li");
  listItemThree.classList.add("sidebar-link");
  const anchorThree = document.createElement("a");
  anchorThree.href = "./budget.html";

  promises.push(
    fetch("./icons/sidebar-icons/budget-icon.svg")
      .then((res) => res.text())
      .then((text) => {
        anchorThree.innerHTML = text;
        const span = document.createElement("span");
        span.textContent = "Budget";
        anchorThree.appendChild(span);
      })
  );
  listItemThree.appendChild(anchorThree);
  list.appendChild(listItemThree);

  sidebarNav.appendChild(list);
  sidebar.append(sidebarNav);

  // footer specific stuff
  const sidebarFooter = document.createElement("div");
  sidebarFooter.classList.add("sidebar-footer");

  const sidebarProfile = document.createElement("div");
  sidebarProfile.classList.add("sidebar-profile");

  const sidebarProfileIcon = document.createElement("div");
  sidebarProfileIcon.classList.add("sidebar-profile-icon");
  sidebarProfileIcon.textContent = "JD";

  const userName = document.createElement("p");
  userName.classList.add("user-name");
  userName.textContent = "Jhon Doe";

  sidebarProfile.append(sidebarProfileIcon, userName);

  const disconnectBtn = document.createElement("button");
  disconnectBtn.classList.add("sidebar-disconnect");

  promises.push(
    fetch("./icons/sidebar-icons/disconnect-icon.svg")
      .then((res) => res.text())
      .then((text) => {
        disconnectBtn.innerHTML = text;
        const span = document.createElement("span");
        span.textContent = "Disconnect";
        disconnectBtn.appendChild(span);
      })
  );
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

export function disableCurrentSidebarLink() {}

import { displayToast } from "../../components/toast.js";
import { insertSidebar } from "../../components/sidebar.js";

document.addEventListener("DOMContentLoaded", () => {
  const user = {};
  const API_URL = "/api";
  const body = document.querySelector("body");

  insertSidebar(body).then(() => {
    document
      .querySelector(".sidebar-disconnect")
      .addEventListener("click", (e) => {
        fetch(API_URL + "/auth/logout", {
          method: "POST",
        })
          .then((res) => {
            return res.json().then((data) => {
              if (res.ok) {
                sessionStorage.setItem(
                  "toast",
                  JSON.stringify({ message: data.message, type: "success" })
                );
                window.location.assign("./login.html");
              } else {
                throw Error(data.error);
              }
            });
          })
          .catch((err) => {
            displayToast(toastContainer, err.message, "error");
          });
      });
  });
  const toastContainer = document.querySelector(".toasts-container");

  fetch(API_URL + "/profile")
    .then((res) => res.json())
    .then((data) => {
      user.id = data.user.id;
      user.name = data.user.prenom + " " + data.user.nom;
      user.accounts = data.acconts;
      return renderPage(user);
    })
    .then(() => body.classList.remove("invisible-unit"));

  const toast = JSON.parse(sessionStorage.getItem("toast"));
  if (toast) {
    displayToast(toastContainer, toast.message, toast.type);
    sessionStorage.removeItem("toast");
  }

  const transactionsContainer = document.querySelector(
    ".list-transaction-container"
  );
  let originalTransaction = null;

  const dateInput = document.querySelector("#transaction-form-date");

  const typeTransactionInput = document.querySelector("#transaction-form-type");

  const formTransferUnit = document.querySelector("#form-unit-transfer");

  dateInput.value = new Date()
    .toISOString()
    .split("T")[0]; /* look for a better way */

  typeTransactionInput.addEventListener("change", (e) => {
    if (typeTransactionInput.value === "TRANSFER") {
      formTransferUnit.classList.remove("invisible-unit");
    } else {
      formTransferUnit.classList.add("invisible-unit");
    }
  });

  async function getTransactions() {
    try {
      const res = await fetch(`${API_URL}/transactions/user`, {
        method: "GET",
        credentials: "include", // IMPORTANT: JWT dans cookies
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      // Backend renvoie { data: [...], meta: {...} }
      const transactions = (json.data || []).map((t) => {
        const amountAbs = Math.abs(Number(t.montant));

        // couleur: income si montant positif, expense si négatif
        const uiType = Number(t.montant) > 0 ? "income" : "expense";

        return {
          id: t.id,
          date: (t.date || "").slice(0, 10),
          category: t.categorie?.nom || "—",
          description: t.description || "—",
          amount: amountAbs,
          type: uiType,

          // utile pour PUT plus tard
          categorieId: t.categorie?.id || null,
        };
      });

      renderTransactions(transactions);
    } catch (err) {
      console.error("GET transactions failed:", err);
      transactionsContainer.innerHTML = `
      <h3>Recent Transactions</h3>
      <p>Erreur lors du chargement des transactions</p>
    `;
    }
  }

  function renderTransactions(transactions) {
    transactionsContainer.innerHTML = `
    <h3>Recent Transactions</h3>
  `;

    if (!transactions.length) {
      transactionsContainer.innerHTML += `
      <p>Aucune transaction pour le moment</p>
    `;
      return;
    }

    const table = document.createElement("table");
    table.classList.add("transactions-table");

    table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Amount</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

    const tbody = table.querySelector("tbody");

    transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .forEach((tx) => {
        const row = document.createElement("tr");

        row.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.category}</td>
      <td>${tx.description}</td>
      <td class="${tx.type === "income" ? "amount-income" : "amount-expense"}">
        ${tx.type === "income" ? "+" : "-"}${tx.amount} DH
      </td>
      <td class="actions-cell">
        <button class="icon-btn btn-edit" title="Modifier">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18-11.5c0-.4-.16-.78-.44-1.06l-2.34-2.34a1.5 1.5 0 0 0-2.12 0l-1.83 1.83 3.75 3.75 1.83-1.83c.28-.28.44-.66.44-1.06z"/>
          </svg>
        </button>

        <button class="icon-btn btn-delete" title="Supprimer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 1h4v2H2V3h4l1-1z"/>
          </svg>
        </button>
      </td>

    `;

        // Bouton EDIT → ouvre le modal
        row.querySelector(".btn-edit").addEventListener("click", (e) => {
          e.stopPropagation();
          selectTransaction(tx);
        });

        // Bouton DELETE → suppression directe
        row.querySelector(".btn-delete").addEventListener("click", (e) => {
          e.stopPropagation();
          handleDeleteTransaction(tx.id);
        });

        tbody.appendChild(row);
      });

    transactionsContainer.appendChild(table);
  }
  let selectedTransaction = null;

  function selectTransaction(transaction) {
    selectedTransaction = transaction;
    console.log("Transaction sélectionnée:", selectedTransaction);
    openTransactionModal(transaction);
  }

  function openTransactionModal(transaction) {
    if (!transaction) return;

    originalTransaction = { ...transaction };

    document.getElementById("modal-date").value = transaction.date;
    document.getElementById("modal-type").value = transaction.type;
    document.getElementById("modal-category").value = transaction.category;
    document.getElementById("modal-description").value =
      transaction.description;
    document.getElementById("modal-amount").value = transaction.amount;
    document.getElementById("modal-save-btn").disabled = true;

    document
      .getElementById("modal-save-btn")
      .addEventListener("click", async () => {
        await handleUpdateTransaction();
      });

    document
      .getElementById("transaction-modal-overlay")
      .classList.remove("hidden");
  }

  function closeTransactionModal() {
    document
      .getElementById("transaction-modal-overlay")
      .classList.add("hidden");

    // Clear selection and reset original transaction so input listeners are safe
    selectedTransaction = null;
    originalTransaction = null;

    // Ensure save button is disabled when modal closed
    const saveBtn = document.getElementById("modal-save-btn");
    if (saveBtn) saveBtn.disabled = true;
  }

  function hasTransactionChanged() {
    // If no original transaction is loaded, consider there is no change.
    if (!originalTransaction) return false;

    return (
      document.getElementById("modal-date").value !==
        originalTransaction.date ||
      document.getElementById("modal-type").value !==
        originalTransaction.type ||
      document.getElementById("modal-category").value !==
        originalTransaction.category ||
      document.getElementById("modal-description").value !==
        originalTransaction.description ||
      Number(document.getElementById("modal-amount").value || 0) !==
        originalTransaction.amount
    );
  }

  [
    "modal-date",
    "modal-type",
    "modal-category",
    "modal-description",
    "modal-amount",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      const changed = hasTransactionChanged();
      const saveBtn = document.getElementById("modal-save-btn");

      saveBtn.disabled = !changed;

      console.log("Form changed:", changed);
    });
  });

  document
    .getElementById("modal-close-btn")
    .addEventListener("click", closeTransactionModal);

  document
    .getElementById("modal-cancel-btn")
    .addEventListener("click", closeTransactionModal);

  function handleDeleteTransaction(transactionId) {
    openConfirmModal(async () => {
      try {
        const res = await fetch(`${API_URL}/transactions/${transactionId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        await reRenderPage(user);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Erreur lors de la suppression");
      }
    });
  }

  async function handleUpdateTransaction() {
    if (!selectedTransaction) return;

    try {
      const payload = {
        montant: Number(document.getElementById("modal-amount").value),
        description: document.getElementById("modal-description").value,
        categorieId: selectedTransaction.categorieId, // temporaire (select plus tard)
      };

      const res = await fetch(
        `${API_URL}/transactions/${selectedTransaction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      closeTransactionModal();
      await reRenderPage(user);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Erreur lors de la mise à jour");
    }
  }

  let confirmCallback = null;

  function openConfirmModal(onConfirm) {
    confirmCallback = onConfirm;

    document.getElementById("confirm-modal-overlay").classList.remove("hidden");
  }

  function closeConfirmModal() {
    confirmCallback = null;

    document.getElementById("confirm-modal-overlay").classList.add("hidden");
  }

  document
    .getElementById("confirm-cancel-btn")
    .addEventListener("click", closeConfirmModal);

  document
    .getElementById("confirm-delete-btn")
    .addEventListener("click", async () => {
      if (typeof confirmCallback === "function") {
        await confirmCallback();
      }
      closeConfirmModal();
    });

  function renderProfile(user) {}

  function renderBalances(user, accounts) {
    const accountCards = document.querySelectorAll(".account-card");

    for (let i = 0; i < user.accounts.length; i++) {
      accountCards[i].querySelector(".account-card-name").textContent =
        user.accounts[i].nom.toUpperCase();
      accountCards[i].querySelector(".account-card-type").textContent =
        user.accounts[i].type.toUpperCase();

      const concernedAccount = accounts.find(
        (account) => account.accountId === user.accounts[i].id
      ); /* this is safer code to get the exact balance for each account but i think
     it is fair to think that they will be in the same i position*/
      accountCards[i].querySelector(".account-card-balance").textContent =
        concernedAccount.accountBalance;
    }

    const totalCardBalance = document.querySelector(".total-card-balance");

    totalCardBalance.textContent = accounts.reduce((sum, account) => {
      sum += +account.accountBalance;
      return sum;
    }, 0);
  }

  function getBalances(user) {
    // still needs error checking
    const balances = [];
    const promises = [];
    user.accounts.forEach((account) => {
      promises.push(
        fetch(`${API_URL}/balance?compteId=${account.id}`)
          .then((res) => res.json())
          .then((data) => {
            balances.push({
              accountId: account.id,
              accountBalance: data.finalBalance,
            });
          })
      );
    });

    return Promise.all(promises).then(() => {
      renderBalances(user, balances);
    });
  }

  function renderAddTransactionContainer(user) {
    const accountForms = document.querySelectorAll(".transaction-form-account");
    accountForms.forEach((accountForm) => {
      user.accounts.forEach((account) => {
        const option = document.createElement("option");
        option.value = account.id;
        option.textContent = account.nom;
        accountForm.appendChild(option);
      });
    });
    return fetch(API_URL + "/categories")
      .then((res) => res.json())
      .then((data) => {
        const transactionForm = document.querySelector(
          "#transaction-form-category"
        );
        data.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.nom;
          transactionForm.appendChild(option);
        });
      });
  }

  function renderPage(user) {
    renderProfile(user);
    return getBalances(user)
      .then(() => renderAddTransactionContainer(user))
      .then(() => getTransactions());
  }
  function reRenderPage(user) {
    return getBalances(user).then(() => getTransactions());
  }

  const form = document.querySelector(".add-transaction-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    fetch(API_URL + "/transactions", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        montant: +document.querySelector("#transaction-form-amount").value,
        type: document.querySelector("#transaction-form-type").value,
        description: document.querySelector("#transaction-form-description")
          .value,
        compteId: +document.querySelector("#transaction-form-from-account")
          .value,
        idDestination: +document.querySelector("#transaction-form-to-account")
          .value,
        categorieId: +document.querySelector("#transaction-form-category")
          .value,
      }),
    }).then((res) => {
      if (res.ok) {
        reRenderPage(user);
      } else {
        alert("Error");
      }
    });
  });
});

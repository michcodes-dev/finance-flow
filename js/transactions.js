let transactions = [];
function loadTransactions() {
    const savedTransactions = localStorage.getItem("financeflow-transactions");
    transactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];
}
loadTransactions();
const transactionsList = document.querySelector("#transactions-list");
const totalTransactionsElement = document.querySelector("#total-transactions");
const totalIncomeElement = document.querySelector("#total-income");
const totalExpensesElement = document.querySelector("#total-expenses");
const searchInput = document.querySelector("#transaction-search");
const typeFilter = document.querySelector("#type-filter");
const categoryFilter = document.querySelector("#category-filter");
const deleteModal = document.querySelector("#delete-modal");
const deleteMessage = document.querySelector("#delete-message");
const cancelDeleteBtn = document.querySelector("#cancel-delete");
const confirmDeleteBtn = document.querySelector("#confirm-delete");
function getCategoryIcon(category) {
    const icons = {
        food: "fa-utensils",
        shopping: "fa-bag-shopping",
        bills: "fa-file-invoice",
        transport: "fa-car",
        salary: "fa-money-bill-wave",
        entertainment: "fa-film",
        other: "fa-wallet",
    };
    return icons[category.toLowerCase()] ?? "fa-wallet";
}
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
function updateTransactionSummary() {
    const totalTransactions = transactions.length;
    const totalIncome = transactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpenses = transactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);
    totalTransactionsElement.textContent =
        totalTransactions.toString();
    totalIncomeElement.textContent =
        `₦${totalIncome.toLocaleString()}`;
    totalExpensesElement.textContent =
        `₦${totalExpenses.toLocaleString()}`;
}
function renderTransactions(transactionList) {
    transactionsList.innerHTML = "";
    if (transactionList.length === 0) {
        transactionsList.innerHTML = `
        <div class="transactions-empty">
            <div class="transactions-empty-icon">
                <i class="fa-solid fa-receipt"></i>
            </div>

            <h3>No transactions found</h3>

            <p>
                Your financial activity will appear here once you add a transaction.
            </p>
        </div>
    `;
        return;
    }
    // Newest transaction date → oldest transaction date
    const sortedTransactions = [...transactionList].sort((a, b) => {
        const dateDifference = new Date(b.date).getTime() -
            new Date(a.date).getTime();
        // If dates are the same, newest added transaction comes first
        if (dateDifference === 0) {
            return Number(b.id) - Number(a.id);
        }
        return dateDifference;
    });
    sortedTransactions.forEach((transaction) => {
        const row = document.createElement("div");
        row.className = "transaction-row";
        row.innerHTML = `
            <div class="transaction-description">
                <div class="tx-icon ${transaction.type}">
                    <i class="fa-solid ${getCategoryIcon(transaction.category)}"></i>
                </div>

                <div class="tx-info">
                    <p class="tx-title">${transaction.description}</p>
                    <span class="tx-meta">${transaction.category}</span>
                </div>
            </div>

            <div class="transaction-category">
                ${transaction.category}
            </div>

            <div class="transaction-date">
                ${formatDate(transaction.date)}
            </div>

            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"}₦${transaction.amount.toLocaleString()}
            </div>
            
            <div class="transaction-actions">
                <button
                    type="button"
                    class="edit-btn"
                    data-id="${transaction.id}"
                    aria-label="Edit transaction"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    data-id="${transaction.id}"
                    aria-label="Delete transaction"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        transactionsList.appendChild(row);
    });
}
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedType = typeFilter.value;
    const selectedCategory = categoryFilter.value;
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
            transaction.category.toLowerCase().includes(searchTerm);
        const matchesType = selectedType === "all" ||
            transaction.type === selectedType;
        const matchesCategory = selectedCategory === "all" ||
            transaction.category === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
    });
    renderTransactions(filteredTransactions);
}
searchInput.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
applyFilters();
window.addEventListener("pageshow", () => {
    loadTransactions();
    updateTransactionSummary();
    applyFilters();
});
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        loadTransactions();
        updateTransactionSummary();
        applyFilters();
    }
});
const addTransactionBtn = document.querySelector(".add-transaction-btn");
const transactionModal = document.querySelector("#transaction-modal");
const closeModalBtn = document.querySelector("#close-modal");
const cancelModalBtn = document.querySelector("#cancel-modal");
addTransactionBtn?.addEventListener("click", () => {
    editingTransactionId = null;
    selectedType = "income";
    transactionForm.reset();
    typeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.type === "income");
    });
    modalTitle.textContent = "Add Transaction";
    modalDescription.textContent = "Record your income or expense.";
    saveTransactionBtn.textContent = "Save Transaction";
    transactionModal?.classList.add("show");
});
closeModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
});
cancelModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
});
let selectedType = "income";
let editingTransactionId = null;
const typeButtons = document.querySelectorAll(".type-btn");
typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        typeButtons.forEach((btn) => {
            btn.classList.remove("active");
        });
        button.classList.add("active");
        selectedType = button.dataset.type;
    });
});
const transactionForm = document.querySelector("#transaction-form");
const amountInput = document.querySelector("#amount");
const descriptionInput = document.querySelector("#description");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const modalTitle = document.querySelector("#modal-title");
const modalDescription = document.querySelector("#modal-description");
const saveTransactionBtn = document.querySelector("#save-transaction-btn span");
transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (editingTransactionId) {
        const transactionIndex = transactions.findIndex((transaction) => transaction.id === editingTransactionId);
        if (transactionIndex !== -1) {
            transactions[transactionIndex] = {
                id: editingTransactionId,
                type: selectedType,
                amount: Number(amountInput.value),
                description: descriptionInput.value,
                category: categoryInput.value,
                date: dateInput.value,
            };
        }
    }
    else {
        const newTransaction = {
            id: Date.now().toString(),
            type: selectedType,
            amount: Number(amountInput.value),
            description: descriptionInput.value,
            category: categoryInput.value,
            date: dateInput.value,
        };
        transactions.push(newTransaction);
    }
    localStorage.setItem("financeflow-transactions", JSON.stringify(transactions));
    updateTransactionSummary();
    applyFilters();
    transactionForm.reset();
    editingTransactionId = null;
    selectedType = "income";
    typeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.type === "income");
    });
    transactionModal?.classList.remove("show");
});
let pendingDeleteId = null;
transactionsList.addEventListener("click", (event) => {
    const target = event.target;
    const deleteButton = target.closest(".delete-btn");
    const editButton = target.closest(".edit-btn");
    // DELETE
    if (deleteButton) {
        const transactionId = deleteButton.dataset.id;
        if (!transactionId)
            return;
        const transaction = transactions.find((transaction) => transaction.id === transactionId);
        if (!transaction)
            return;
        deleteMessage.textContent =
            `Are you sure you want to delete "${transaction.description}"? This action cannot be undone.`;
        deleteModal?.classList.add("show");
        pendingDeleteId = transaction.id;
        return;
    }
    // EDIT
    if (editButton) {
        const transactionId = editButton.dataset.id;
        if (!transactionId)
            return;
        const transaction = transactions.find((transaction) => transaction.id === transactionId);
        if (!transaction)
            return;
        editingTransactionId = transaction.id;
        modalTitle.textContent = "Edit Transaction";
        modalDescription.textContent = "Update the details of this transaction.";
        saveTransactionBtn.textContent = "Save Changes";
        amountInput.value = transaction.amount.toString();
        descriptionInput.value = transaction.description;
        categoryInput.value = transaction.category;
        dateInput.value = transaction.date;
        selectedType = transaction.type;
        typeButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.type === selectedType);
        });
        transactionModal?.classList.add("show");
    }
});
cancelDeleteBtn?.addEventListener("click", () => {
    pendingDeleteId = null;
    deleteModal?.classList.remove("show");
});
confirmDeleteBtn?.addEventListener("click", () => {
    if (!pendingDeleteId)
        return;
    const transactionIndex = transactions.findIndex((transaction) => transaction.id === pendingDeleteId);
    if (transactionIndex === -1)
        return;
    transactions.splice(transactionIndex, 1);
    localStorage.setItem("financeflow-transactions", JSON.stringify(transactions));
    updateTransactionSummary();
    pendingDeleteId = null;
    deleteModal?.classList.remove("show");
    updateTransactionSummary();
    applyFilters();
});
export {};

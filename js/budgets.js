const budgetStorageKey = "financeflow-budgets";
let budgets = JSON.parse(localStorage.getItem(budgetStorageKey) || "[]");
let budgetIdToEdit = null;
const addBudgetBtn = document.querySelector("#add-budget-btn");
const budgetModal = document.querySelector("#budget-modal");
const closeBudgetModal = document.querySelector("#close-budget-modal");
const cancelBudgetBtn = document.querySelector("#cancel-budget");
const budgetForm = document.querySelector("#budget-form");
const categoryInput = document.querySelector("#budget-category");
const limitInput = document.querySelector("#budget-limit");
function openBudgetModal() {
    budgetModal?.classList.add("show");
}
function hideBudgetModal() {
    budgetModal?.classList.remove("show");
    budgetForm?.reset();
    if (categoryInput) {
        categoryInput.disabled = false;
    }
    budgetIdToEdit = null;
    if (budgetModalTitle) {
        budgetModalTitle.textContent = "Create Budget";
    }
    if (saveBudgetBtn) {
        saveBudgetBtn.textContent = "Create Budget";
    }
}
addBudgetBtn?.addEventListener("click", openBudgetModal);
closeBudgetModal?.addEventListener("click", hideBudgetModal);
cancelBudgetBtn?.addEventListener("click", hideBudgetModal);
budgetModal?.addEventListener("click", (event) => {
    if (event.target === budgetModal) {
        hideBudgetModal();
    }
});
budgetForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = categoryInput?.value;
    const limit = Number(limitInput?.value);
    if (!category || !Number.isFinite(limit) || limit <= 0) {
        return;
    }
    if (budgetIdToEdit) {
        // EDIT MODE: Update the existing budget
        const budget = budgets.find((item) => item.id === budgetIdToEdit);
        if (!budget)
            return;
        budget.limit = limit;
    }
    else {
        // CREATE MODE: Check for duplicate categories
        const alreadyExists = budgets.some((budget) => budget.category === category);
        if (alreadyExists) {
            alert("A budget for this category already exists.");
            return;
        }
        const newBudget = {
            id: Date.now().toString(),
            category,
            limit,
        };
        budgets.push(newBudget);
    }
    localStorage.setItem(budgetStorageKey, JSON.stringify(budgets));
    budgetForm?.reset();
    if (categoryInput) {
        categoryInput.disabled = false;
    }
    budgetIdToEdit = null;
    if (budgetModalTitle) {
        budgetModalTitle.textContent = "Create Budget";
    }
    if (saveBudgetBtn) {
        saveBudgetBtn.textContent = "Create Budget";
    }
    hideBudgetModal();
    renderBudgets();
});
const budgetList = document.querySelector("#budget-list");
const totalBudgetEl = document.querySelector("#total-budget");
const budgetSpentEl = document.querySelector("#budget-spent");
const budgetRemainingEl = document.querySelector("#budget-remaining");
const budgetAlertsList = document.querySelector("#budget-alerts-list");
const budgetAlertCount = document.querySelector("#budget-alert-count");
function formatMoney(amount) {
    return amount.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
    });
}
function getMonthlyExpenses() {
    const savedTransactions = localStorage.getItem("financeflow-transactions");
    const transactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];
    const now = new Date();
    return transactions.filter((transaction) => {
        const [year, month, day] = transaction.date.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return (transaction.type === "expense" &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear());
    });
}
function renderBudgetAlerts(expenses) {
    if (!budgetAlertsList)
        return;
    const alerts = budgets
        .map((budget) => {
        const spent = expenses
            .filter((transaction) => transaction.category.toLowerCase() ===
            budget.category.toLowerCase())
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        if (percentage < 80)
            return null;
        const isOverBudget = percentage >= 100;
        const difference = Math.abs(budget.limit - spent);
        return {
            category: budget.category,
            isOverBudget,
            percentage,
            title: spent > budget.limit
                ? "budget exceeded"
                : spent === budget.limit
                    ? "budget limit reached"
                    : "budget almost reached",
            message: spent > budget.limit
                ? `You have exceeded this budget by ${formatMoney(difference)}.`
                : spent === budget.limit
                    ? "You have used your entire budget."
                    : `${formatMoney(budget.limit - spent)} remaining before you reach your limit.`,
        };
    })
        .filter((alert) => alert !== null);
    if (budgetAlertCount) {
        budgetAlertCount.textContent =
            `${alerts.length} ${alerts.length === 1 ? "alert" : "alerts"}`;
    }
    if (alerts.length === 0) {
        budgetAlertsList.innerHTML = `
            <div class="budget-alert-empty">
                <i class="fa-solid fa-circle-check"></i>
                <span>All good! Your budgets are on track.</span>
            </div>
        `;
        return;
    }
    budgetAlertsList.innerHTML = alerts
        .map((alert) => {
        const category = alert.category.charAt(0).toUpperCase() +
            alert.category.slice(1);
        return `
                <div class="budget-alert ${alert.isOverBudget ? "danger" : "warning"}">
                    <div class="budget-alert-icon">
                        <i class="fa-solid ${alert.isOverBudget
            ? "fa-circle-exclamation"
            : "fa-triangle-exclamation"}"></i>
                    </div>

                    <div class="budget-alert-content">
                        <h3>${category} ${alert.title}</h3>
                        <p>${alert.message}</p>
                    </div>

                    <span class="budget-alert-percentage">
                        ${alert.percentage.toFixed(0)}%
                    </span>
                </div>
            `;
    })
        .join("");
}
function renderBudgets() {
    if (!budgetList)
        return;
    const expenses = getMonthlyExpenses();
    renderBudgetAlerts(expenses);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
    const totalSpent = budgets.reduce((sum, budget) => {
        const categorySpent = expenses
            .filter((transaction) => transaction.category.toLowerCase() ===
            budget.category.toLowerCase())
            .reduce((categoryTotal, transaction) => {
            return categoryTotal + transaction.amount;
        }, 0);
        return sum + categorySpent;
    }, 0);
    if (totalBudgetEl) {
        totalBudgetEl.textContent = formatMoney(totalBudget);
    }
    if (budgetSpentEl) {
        budgetSpentEl.textContent = formatMoney(totalSpent);
    }
    if (budgetRemainingEl) {
        budgetRemainingEl.textContent = formatMoney(totalBudget - totalSpent);
    }
    if (budgets.length === 0) {
        budgetList.innerHTML = `
            <div class="budget-empty">
                <i class="fa-solid fa-wallet"></i>
                <h3>No budgets yet</h3>
                <p>Create your first budget to start tracking your spending.</p>
            </div>
        `;
        return;
    }
    budgetList.innerHTML = budgets.map((budget) => {
        const spent = expenses
            .filter((transaction) => transaction.category.toLowerCase() ===
            budget.category.toLowerCase())
            .reduce((sum, transaction) => sum + transaction.amount, 0);
        const percentage = budget.limit > 0
            ? (spent / budget.limit) * 100
            : 0;
        const progress = Math.min(percentage, 100);
        const status = spent > budget.limit
            ? "Over budget"
            : spent === budget.limit
                ? "Limit reached"
                : percentage >= 80
                    ? "Approaching limit"
                    : "On track";
        return `
            <div class="budget-item">
                <div class="budget-item-top">
                    <div>
                        <h3>${budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}</h3>
                        <p>${formatMoney(spent)} spent of ${formatMoney(budget.limit)}</p>
                    </div>
                    
                    <div class="budget-actions">
                        <span class="budget-status ${percentage >= 100
            ? "over"
            : percentage >= 80
                ? "warning"
                : "good"}">${status}</span>
                        
                        <button
                            type="button"
                            class="edit-budget-btn"
                            data-budget-id="${budget.id}"
                            aria-label="Edit ${budget.category} budget"
                            title="Edit budget"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        
                        <button
                            type="button"
                            class="delete-budget-btn"
                            data-budget-id="${budget.id}"
                            aria-label="Delete ${budget.category} budget"
                            title="Delete budget"
                        >
                            <i class="fa-solid fa-trash"></i>
                            </button>
                    </div>
                </div>

                <div
                    class="budget-progress-track"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="${budget.limit}"
                    aria-valuenow="${spent}"
                    aria-label="${budget.category} budget progress"
                >
                    <div
                        class="budget-progress-fill"
                        style="width: ${progress}%"
                    ></div>
                </div>

                <div class="budget-item-bottom">
                    <span>${percentage.toFixed(1)}% used</span>
                    <span>${formatMoney(budget.limit - spent)} remaining</span>
                </div>
            </div>
        `;
    }).join("");
}
renderBudgets();
const deleteBudgetModal = document.querySelector("#delete-budget-modal");
const cancelDeleteBudgetBtn = document.querySelector("#cancel-delete-budget");
const confirmDeleteBudgetBtn = document.querySelector("#confirm-delete-budget");
const budgetModalTitle = document.querySelector("#budget-modal-title");
const saveBudgetBtn = document.querySelector("#save-budget-btn");
let budgetIdToDelete = null;
function openDeleteBudgetModal(budgetId) {
    budgetIdToDelete = budgetId;
    deleteBudgetModal?.classList.add("show");
}
function closeDeleteBudgetModal() {
    budgetIdToDelete = null;
    deleteBudgetModal?.classList.remove("show");
}
budgetList?.addEventListener("click", (event) => {
    const target = event.target;
    const editButton = target.closest(".edit-budget-btn");
    if (editButton) {
        const budgetId = editButton.dataset.budgetId;
        const budget = budgets.find((item) => item.id === budgetId);
        if (!budget)
            return;
        budgetIdToEdit = budget.id;
        if (categoryInput)
            categoryInput.value = budget.category;
        if (limitInput)
            limitInput.value = budget.limit.toString();
        if (categoryInput)
            categoryInput.disabled = true;
        if (budgetModalTitle)
            budgetModalTitle.textContent = "Edit Budget";
        if (saveBudgetBtn)
            saveBudgetBtn.textContent = "Save Changes";
        openBudgetModal();
        return;
    }
    const deleteButton = target.closest(".delete-budget-btn");
    if (!deleteButton)
        return;
    const budgetId = deleteButton.dataset.budgetId;
    if (!budgetId)
        return;
    openDeleteBudgetModal(budgetId);
});
cancelDeleteBudgetBtn?.addEventListener("click", closeDeleteBudgetModal);
deleteBudgetModal?.addEventListener("click", (event) => {
    if (event.target === deleteBudgetModal) {
        closeDeleteBudgetModal();
    }
});
confirmDeleteBudgetBtn?.addEventListener("click", () => {
    if (!budgetIdToDelete)
        return;
    budgets = budgets.filter((budget) => budget.id !== budgetIdToDelete);
    localStorage.setItem(budgetStorageKey, JSON.stringify(budgets));
    closeDeleteBudgetModal();
    renderBudgets();
});
document
    .querySelector("#bottom-add-budget")
    ?.addEventListener("click", openBudgetModal);
export {};

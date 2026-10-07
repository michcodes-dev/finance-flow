"use strict";
const greetingEl = document.querySelector("#greeting");
const username = "Michael";
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "";
    if (hour < 12) {
        greeting = "Good morning";
    }
    else if (hour < 17) {
        greeting = "Good afternoon";
    }
    else if (hour < 21) {
        greeting = "Good evening";
    }
    else {
        greeting = "Good night";
    }
    greetingEl.textContent = `${greeting}, ${username}`;
}
updateGreeting();
const savedTransactions = localStorage.getItem("financeflow-transactions");
const transactions = savedTransactions
    ? JSON.parse(savedTransactions)
    : [];
const addTransactionBtn = document.querySelector(".add-transaction-btn");
const transactionModal = document.querySelector("#transaction-modal");
addTransactionBtn?.addEventListener("click", () => {
    transactionModal?.classList.add("show");
});
const closeModalBtn = document.querySelector("#close-modal");
const cancelModalBtn = document.querySelector("#cancel-modal");
closeModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
});
cancelModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
});
let selectedType = "income";
const typeButtons = document.querySelectorAll(".type-btn");
typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        typeButtons.forEach((btn) => {
            btn.classList.remove("active");
        });
        button.classList.add("active");
        selectedType = button.dataset.type ?? "income";
    });
});
const amountInput = document.querySelector("#amount");
const descriptionInput = document.querySelector("#description");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const transactionForm = document.querySelector("#transaction-form");
const recentList = document.querySelector("#recent-transactions");
const spendingChart = document.querySelector("#spending-chart");
const periodFilter = document.querySelector("#period-filter");
const incomePeriodEl = document.querySelector("#income-period");
const expensePeriodEl = document.querySelector("#expense-period");
function updateSummaryPeriod() {
    const period = periodFilter.value;
    if (period === "week") {
        incomePeriodEl.textContent = "This week";
        expensePeriodEl.textContent = "This week";
    }
    else if (period === "year") {
        incomePeriodEl.textContent = "This year";
        expensePeriodEl.textContent = "This year";
    }
    else {
        incomePeriodEl.textContent = "This month";
        expensePeriodEl.textContent = "This month";
    }
}
function getCategoryIcon(category) {
    const icons = {
        food: "fa-utensils",
        shopping: "fa-bag-shopping",
        bills: "fa-file-invoice",
        transport: "fa-car",
        salary: "fa-money-bill-wave",
        other: "fa-wallet",
        entertainment: "fa-film",
    };
    return icons[category.toLowerCase()] ?? "fa-wallet";
}
function renderTransactions() {
    recentList.innerHTML = "";
    const latest = [...transactions].reverse().slice(0, 5);
    latest.forEach((t) => {
        const row = document.createElement("div");
        row.className = "transaction-item";
        const icon = document.createElement("div");
        icon.className = `tx-icon ${t.type}`;
        const iconElement = document.createElement("i");
        iconElement.className = `fa-solid ${getCategoryIcon(t.category)}`;
        icon.appendChild(iconElement);
        const info = document.createElement("div");
        info.className = "tx-info";
        const title = document.createElement("p");
        title.className = "tx-title";
        title.textContent = t.description;
        const meta = document.createElement("span");
        meta.className = "tx-meta";
        meta.textContent = t.category + " · " + formatDate(t.date);
        const amount = document.createElement("p");
        amount.className = "tx-amount " + t.type;
        amount.textContent = (t.type === "income" ? "+" : "-") + formatNaira(t.amount);
        info.append(title, meta);
        row.append(icon, info, amount);
        recentList.append(row);
    });
}
transactionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const amount = Number(amountInput.value);
    const description = descriptionInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;
    const newTransaction = {
        id: Date.now().toString(),
        type: selectedType,
        amount: amount,
        description: description,
        category: category,
        date: date,
    };
    transactions.push(newTransaction);
    localStorage.setItem("financeflow-transactions", JSON.stringify(transactions));
    renderTransactions();
    updateSummary();
    transactionForm.reset();
    selectedType = "income";
    typeButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.type === "income");
    });
    transactionModal?.classList.remove("show");
});
const totalBalanceEl = document.querySelector("#total-balance");
const totalIncomeEl = document.querySelector("#total-income");
const totalExpensesEl = document.querySelector("#total-expenses");
function formatNaira(value) {
    return value.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });
}
function formatDate(date) {
    return new Date(date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
function getTransactionsByPeriod(period) {
    const now = new Date();
    return transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        if (period === "week") {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return transactionDate >= weekAgo && transactionDate <= now;
        }
        if (period === "year") {
            return transactionDate.getFullYear() === now.getFullYear();
        }
        return (transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear());
    });
}
function calculateSpending(period) {
    const spending = {};
    const filteredTransactions = getTransactionsByPeriod(period);
    filteredTransactions.forEach((t) => {
        if (t.type !== "expense") {
            return;
        }
        if (!spending[t.category]) {
            spending[t.category] = 0;
        }
        spending[t.category] += t.amount;
    });
    return spending;
}
function renderSpendingOverview() {
    const spending = calculateSpending(periodFilter.value);
    spendingChart.innerHTML = "";
    const totalSpending = Object.values(spending).reduce((total, amount) => total + amount, 0);
    Object.entries(spending).forEach(([category, amount]) => {
        const percentage = (amount / totalSpending) * 100;
        const row = document.createElement("div");
        row.className = "spending-row";
        const info = document.createElement("div");
        info.className = "spending-info";
        const categoryName = document.createElement("span");
        categoryName.textContent =
            category.charAt(0).toUpperCase() + category.slice(1);
        const categoryAmount = document.createElement("span");
        categoryAmount.textContent = formatNaira(amount);
        info.append(categoryName, categoryAmount);
        const bar = document.createElement("div");
        bar.className = "spending-bar";
        const fill = document.createElement("div");
        fill.className = "spending-fill";
        fill.style.width = `${percentage}%`;
        bar.appendChild(fill);
        row.append(info, bar);
        spendingChart.appendChild(row);
    });
}
function updateSummary() {
    let income = 0;
    let expenses = 0;
    const filteredTransactions = getTransactionsByPeriod(periodFilter.value);
    filteredTransactions.forEach((t) => {
        if (t.type === "income") {
            income += t.amount;
        }
        else {
            expenses += t.amount;
        }
    });
    const balance = income - expenses;
    totalIncomeEl.textContent = formatNaira(income);
    totalExpensesEl.textContent = formatNaira(expenses);
    totalBalanceEl.textContent = formatNaira(balance);
}
renderTransactions();
updateSummary();
renderSpendingOverview();
periodFilter.addEventListener("change", () => {
    renderSpendingOverview();
    updateSummaryPeriod();
    updateSummary();
});

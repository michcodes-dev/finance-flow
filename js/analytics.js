const savedTransactions = localStorage.getItem("financeflow-transactions");
const incomeElement = document.getElementById("analytics-income");
const expensesElement = document.getElementById("analytics-expenses");
const cashFlowElement = document.getElementById("analytics-cash-flow");
const transactionsElement = document.getElementById("analytics-transactions");
const transactions = savedTransactions
    ? JSON.parse(savedTransactions)
    : [];
function totalOf(items, type) {
    return items
        .filter((transaction) => transaction.type === type)
        .reduce((total, transaction) => total + transaction.amount, 0);
}
const money = (amount) => `₦${amount.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
})}`;
const getDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
};
const currentMonthTransactions = () => {
    const now = new Date();
    return transactions.filter((transaction) => {
        const date = getDate(transaction.date);
        return (date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear());
    });
};
function renderSummary(period) {
    const items = period === "all"
        ? transactions
        : currentMonthTransactions();
    const income = totalOf(items, "income");
    const expenses = totalOf(items, "expense");
    if (incomeElement) {
        incomeElement.textContent = money(income);
    }
    if (expensesElement) {
        expensesElement.textContent = money(expenses);
    }
    if (cashFlowElement) {
        cashFlowElement.textContent = money(income - expenses);
    }
    if (transactionsElement) {
        transactionsElement.textContent = items.length.toString();
    }
}
const incomeExpenseChart = document.getElementById("income-expense-chart");
const categoryChart = document.getElementById("category-chart");
const breakdownList = document.getElementById("spending-breakdown-list");
const periodSelect = document.getElementById("analytics-period");
function renderIncomeExpenseChart(period) {
    if (!incomeExpenseChart)
        return;
    const filtered = period === "all"
        ? transactions
        : currentMonthTransactions();
    const daily = {};
    filtered.forEach((transaction) => {
        if (!daily[transaction.date]) {
            daily[transaction.date] = { income: 0, expense: 0 };
        }
        daily[transaction.date][transaction.type] += transaction.amount;
    });
    const days = Object.entries(daily).sort(([a], [b]) => getDate(a).getTime() - getDate(b).getTime());
    if (!days.length) {
        incomeExpenseChart.innerHTML = `
            <div class="chart-empty">
                <i class="fa-solid fa-chart-column"></i>
                <p>No transactions for this period yet.</p>
            </div>`;
        return;
    }
    // Show at most the latest 10 transaction dates to keep the chart readable.
    const visibleDays = days.slice(-10);
    const maxValue = Math.max(...visibleDays.flatMap(([, totals]) => [
        totals.income,
        totals.expense,
    ]), 1);
    const columns = visibleDays.map(([date, totals]) => {
        const incomeHeight = totals.income / maxValue * 100;
        const expenseHeight = totals.expense / maxValue * 100;
        return `
            <div class="analytics-bar-column">
                <div class="analytics-bars">
                    <div class="analytics-bar-slot">
                        <div
                            class="analytics-bar analytics-income-bar"
                            style="height:${incomeHeight}%"
                            title="Income: ${money(totals.income)}"
                        ></div>
                    </div>
                    <div class="analytics-bar-slot">
                        <div
                            class="analytics-bar analytics-expense-bar"
                            style="height:${expenseHeight}%"
                            title="Expenses: ${money(totals.expense)}"
                        ></div>
                    </div>
                </div>
                <span class="analytics-date-label">${getDate(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
            </div>`;
    }).join("");
    incomeExpenseChart.innerHTML = `
        <div class="analytics-chart-inner">
            <div class="analytics-y-labels">
                <span>${money(maxValue)}</span>
                <span>${money(maxValue * 0.75)}</span>
                <span>${money(maxValue * 0.5)}</span>
                <span>${money(maxValue * 0.25)}</span>
                <span>₦0</span>
            </div>
            <div class="analytics-plot">
                <div class="analytics-grid-lines">
                    <span></span><span></span><span></span>
                    <span></span><span></span>
                </div>
                <div class="analytics-columns">${columns}</div>
            </div>
        </div>
        <div class="analytics-legend">
            <span><i class="legend-income"></i>Income</span>
            <span><i class="legend-expense"></i>Expenses</span>
        </div>`;
}
const categoryIcons = {
    food: "fa-utensils",
    shopping: "fa-bag-shopping",
    bills: "fa-file-invoice",
    transport: "fa-car",
    salary: "fa-money-bill-wave",
    entertainment: "fa-film",
    health: "fa-heart-pulse",
    education: "fa-graduation-cap",
    other: "fa-wallet",
};
function getCategoryIcon(category) {
    return categoryIcons[category.toLowerCase()] ?? "fa-wallet";
}
function renderCategoryCharts(period) {
    if (!categoryChart || !breakdownList)
        return;
    const filteredTransactions = period === "all"
        ? transactions
        : currentMonthTransactions();
    const expenses = filteredTransactions.filter((transaction) => transaction.type === "expense");
    const totals = {};
    const counts = {};
    expenses.forEach((transaction) => {
        const category = transaction.category || "Other";
        totals[category] = (totals[category] ?? 0) + transaction.amount;
        counts[category] = (counts[category] ?? 0) + 1;
    });
    const categories = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const totalExpenses = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
    if (!categories.length || totalExpenses <= 0) {
        categoryChart.innerHTML = `
            <div class="chart-empty">
                <i class="fa-solid fa-chart-pie"></i>
                <p>No expense data available yet.</p>
            </div>`;
        breakdownList.innerHTML = `
            <div class="breakdown-empty">
                <i class="fa-solid fa-receipt"></i>
                <p>Your spending breakdown will appear here.</p>
            </div>`;
        return;
    }
    let currentAngle = 0;
    const gradientParts = categories.map(([category, amount], index) => {
        const start = currentAngle;
        const end = start + amount / totalExpenses * 360;
        currentAngle = end;
        return `var(--donut-${index % 6}) ${start}deg ${end}deg`;
    });
    const legend = categories.map(([category, amount], index) => `
        <div class="donut-legend-item">
            <span class="donut-legend-color donut-color-${index % 6}"></span>
            <div class="donut-legend-info">
                <span>${category}</span>
                <strong>${(amount / totalExpenses * 100).toFixed(1)}%</strong>
            </div>
            <span class="donut-legend-amount">${money(amount)}</span>
        </div>
    `).join("");
    categoryChart.innerHTML = `
        <div class="donut-layout">
            <div
                class="donut-chart"
                style="background:conic-gradient(${gradientParts.join(",")})"
                role="img"
                aria-label="Spending by category"
            >
                <div class="donut-hole">
                    <span>Total spent</span>
                    <strong>${money(totalExpenses)}</strong>
                </div>
            </div>
            <div class="donut-legend">${legend}</div>
        </div>`;
    breakdownList.innerHTML = categories.map(([category, amount]) => `
        <div class="breakdown-item">
            <div class="breakdown-icon">
                <i class="fa-solid ${getCategoryIcon(category)}"></i>
            </div>
            <div class="breakdown-info">
                <strong>${category}</strong>
                <span>${counts[category]} transaction${counts[category] === 1 ? "" : "s"}</span>
            </div>
            <div class="breakdown-progress">
                <div class="breakdown-progress-track">
                    <div
                        class="breakdown-progress-fill"
                        style="width:${amount / totalExpenses * 100}%"
                    ></div>
                </div>
                <span>${(amount / totalExpenses * 100).toFixed(1)}%</span>
            </div>
            <strong class="breakdown-amount">${money(amount)}</strong>
        </div>
    `).join("");
}
function renderAnalytics() {
    const period = periodSelect?.value === "all"
        ? "all"
        : "month";
    renderSummary(period);
    renderIncomeExpenseChart(period);
    renderCategoryCharts(period);
}
renderAnalytics();
periodSelect?.addEventListener("change", renderAnalytics);
const notificationBtn = document.querySelector("#notification-btn");
const notificationDropdown = document.querySelector("#notification-dropdown");
const notificationList = document.querySelector("#notification-list");
const notificationCount = document.querySelector("#notification-count");
const notificationDot = document.querySelector(".notification-dot");
function closeNotifications() {
    if (notificationDropdown)
        notificationDropdown.hidden = true;
    notificationBtn?.setAttribute("aria-expanded", "false");
}
function renderNotifications() {
    if (!notificationList)
        return;
    const enabled = localStorage.getItem("financeflow-budget-notifications") !== "false";
    if (!enabled) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fa-regular fa-bell"></i>
                <p>Notifications are turned off.</p>
                <span>Enable Budget Alerts in Settings to see alerts.</span>
            </div>
        `;
        if (notificationCount)
            notificationCount.textContent = "0";
        if (notificationDot)
            notificationDot.hidden = true;
        return;
    }
    const budgets = JSON.parse(localStorage.getItem("financeflow-budgets") || "[]");
    const monthlyExpenses = currentMonthTransactions().filter((t) => t.type === "expense");
    const alerts = budgets.flatMap((budget) => {
        const spent = monthlyExpenses
            .filter((t) => t.category.toLowerCase() === budget.category.toLowerCase())
            .reduce((sum, t) => sum + t.amount, 0);
        const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
        if (percentage < 80)
            return [];
        const isOver = percentage >= 100;
        return [{
                category: budget.category,
                percentage,
                isOver,
                message: isOver
                    ? `You have exceeded this budget by ${money(spent - budget.limit)}.`
                    : `${money(budget.limit - spent)} remaining before you reach your limit.`,
            }];
    });
    if (notificationCount)
        notificationCount.textContent = String(alerts.length);
    if (notificationDot)
        notificationDot.hidden = alerts.length === 0;
    if (alerts.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fa-regular fa-bell"></i>
                <p>You're all caught up!</p>
                <span>No budget alerts right now.</span>
            </div>
        `;
        return;
    }
    notificationList.innerHTML = alerts
        .map((alert) => {
        const name = alert.category.charAt(0).toUpperCase() + alert.category.slice(1);
        return `
                <div class="notification-item ${alert.isOver ? "danger" : "warning"}">
                    <div class="notification-item-icon">
                        <i class="fa-solid ${alert.isOver ? "fa-circle-exclamation" : "fa-triangle-exclamation"}"></i>
                    </div>

                    <div class="notification-item-content">
                        <strong>${name} ${alert.isOver ? "budget exceeded" : "budget almost reached"}</strong>
                        <p>${alert.message}</p>
                        <span>${alert.percentage.toFixed(0)}% of budget used</span>
                    </div>
                </div>
            `;
    })
        .join("");
}
notificationBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!notificationDropdown)
        return;
    if (!notificationDropdown.hidden) {
        closeNotifications();
        return;
    }
    renderNotifications();
    notificationDropdown.hidden = false;
    notificationBtn?.setAttribute("aria-expanded", "true");
});
notificationDropdown?.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", closeNotifications);
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape")
        closeNotifications();
});
renderNotifications();
export {};

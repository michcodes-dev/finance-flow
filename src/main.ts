export {};
type Transaction = {
    id: string;
    type: string;
    amount: number;
    description: string;
    category: string;
    date: string;
};

const greetingEl = document.querySelector("#greeting") as HTMLElement;

function updateGreeting(): void {
    const hour = new Date().getHours();

    let greeting = "";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    } else if (hour < 21) {
        greeting = "Good evening";
    } else {
        greeting = "Good night";
    }

    const username =
        localStorage.getItem("financeflow-display-name") || "User";

    greetingEl.textContent = `${greeting}, ${username}`;
}

updateGreeting();


let transactions: Transaction[] = [];

function loadTransactions() {
    const savedTransactions = localStorage.getItem("financeflow-transactions");

    transactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];
}

loadTransactions();

function todayString(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
}

const addTransactionBtn = document.querySelector(".add-transaction-btn");
const transactionModal = document.querySelector("#transaction-modal");

addTransactionBtn?.addEventListener("click", () => {
    dateInput.value = todayString();
    transactionModal?.classList.add("show");
})

const closeModalBtn = document.querySelector("#close-modal");
const cancelModalBtn = document.querySelector("#cancel-modal");
closeModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
})

cancelModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
})

let selectedType = "income";

const typeButtons = document.querySelectorAll(".type-btn");
typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        typeButtons.forEach((btn) => {
            btn.classList.remove("active");
        });
        button.classList.add("active");

        selectedType = (button as HTMLElement).dataset.type ?? "income";
    });
});

const amountInput = document.querySelector("#amount") as HTMLInputElement;
const descriptionInput = document.querySelector("#description") as HTMLInputElement;
const categoryInput = document.querySelector("#category") as HTMLSelectElement;
const dateInput = document.querySelector("#date") as HTMLInputElement;
const transactionForm = document.querySelector("#transaction-form") as HTMLFormElement;
const recentList = document.querySelector("#recent-transactions") as HTMLElement;
const spendingChart = document.querySelector("#spending-chart") as HTMLElement;
const periodFilter = document.querySelector("#period-filter") as HTMLSelectElement;
const incomePeriodEl = document.querySelector("#income-period") as HTMLElement;
const expensePeriodEl = document.querySelector("#expense-period") as HTMLElement;

function updateSummaryPeriod() {
    const period = periodFilter.value;

    if (period === "week") {
        incomePeriodEl.textContent = "This week";
        expensePeriodEl.textContent = "This week";
    } else if (period === "year") {
        incomePeriodEl.textContent = "This year";
        expensePeriodEl.textContent = "This year";
    } else {
        incomePeriodEl.textContent = "This month";
        expensePeriodEl.textContent = "This month";
    }
}

function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
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
    })

}
transactionForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = Number(amountInput.value);
    const description = descriptionInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: selectedType,
        amount: amount,
        description: description,
        category: category,
        date: date,
    };

    transactions.push(newTransaction);

    localStorage.setItem(
        "financeflow-transactions",
        JSON.stringify(transactions)
    );

    renderTransactions();
    updateSummary();
    renderSpendingOverview();
    renderNotifications();
    
    transactionForm.reset();
    
    selectedType = "income";

    typeButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            (button as HTMLElement).dataset.type === "income"
        );
    });

    transactionModal?.classList.remove("show");
});

const totalBalanceEl = document.querySelector("#total-balance") as HTMLElement;
const totalIncomeEl = document.querySelector("#total-income") as HTMLElement;
const totalExpensesEl = document.querySelector("#total-expenses") as HTMLElement;

function formatNaira(value: number): string {
    return value.toLocaleString("en-NG", {
        style: "currency",
        currency: "NGN",
    });
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getTransactionsByPeriod(period: string): Transaction[] {
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

        return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
        );
    });
}

function calculateSpending(period: string): Record<string, number> {
    const spending: Record<string, number> = {};

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

    const entries = Object.entries(spending);

    if (entries.length === 0) {
        spendingChart.innerHTML = `
            <div class="empty-spending">
                <i class="fa-solid fa-chart-column"></i>
                <p>No expenses for this period yet.</p>
            </div>
        `;
        return;
    }

    const maxAmount = Math.max(...entries.map(([, amount]) => amount));

    const chartMax = Math.ceil(maxAmount / 500) * 500 || 500;
    const scaleValues = [
        chartMax,
        chartMax * 0.75,
        chartMax * 0.5,
        chartMax * 0.25,
        0
    ];

    const chartArea = document.createElement("div");
    chartArea.className = "spending-chart-area";

    const scale = document.createElement("div");
    scale.className = "spending-scale";

    scaleValues.forEach((value) => {
        const label = document.createElement("span");
        label.textContent = formatNaira(value);
        scale.appendChild(label);
    });

    const bars = document.createElement("div");
    bars.className = "spending-bars";

    entries.forEach(([category, amount]) => {
        const percentage = (amount / chartMax) * 100;

        const column = document.createElement("div");
        column.className = "spending-column";

        const amountLabel = document.createElement("span");
        amountLabel.className = "spending-amount";
        amountLabel.textContent = formatNaira(amount);

        const barWrapper = document.createElement("div");
        barWrapper.className = "spending-bar-wrapper";

        const bar = document.createElement("div");
        bar.className = "spending-fill";
        bar.style.height = `${percentage}%`;

        barWrapper.appendChild(bar);

        const categoryName = document.createElement("span");
        categoryName.className = "spending-category";
        categoryName.textContent =
            category.charAt(0).toUpperCase() + category.slice(1);

        column.append(amountLabel, barWrapper, categoryName);
        bars.appendChild(column);
    });

    chartArea.append(scale, bars);
    spendingChart.appendChild(chartArea);
}

function updateSummary() {
    let income = 0;
    let expenses = 0;

    const filteredTransactions = getTransactionsByPeriod(periodFilter.value);

    filteredTransactions.forEach((t) => {
        if (t.type === "income") {
            income += t.amount;
        } else {
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

window.addEventListener("pageshow", () => {
    loadTransactions();
    renderTransactions();
    updateSummaryPeriod();
    updateSummary();
    renderSpendingOverview();
    renderNotifications();
});

periodFilter.addEventListener("change", () => {
    renderSpendingOverview();
    updateSummaryPeriod();
    updateSummary();
});


const profileBtn = document.querySelector<HTMLButtonElement>(
    "#profile-btn"
);

const profileDropdown = document.querySelector<HTMLDivElement>(
    "#profile-dropdown"
);

function closeProfileDropdown(): void {
    profileDropdown?.classList.remove("show");

    if (profileDropdown) {
        profileDropdown.hidden = true;
    }

    profileBtn?.setAttribute("aria-expanded", "false");
}

function toggleProfileDropdown(): void {
    if (!profileBtn || !profileDropdown) return;

    const isOpen = !profileDropdown.hidden;

    profileDropdown.hidden = isOpen;
    profileDropdown.classList.toggle("show", !isOpen);

    profileBtn.setAttribute("aria-expanded", String(!isOpen));
}

profileBtn?.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
    toggleProfileDropdown();
});

document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target;

    if (!(target instanceof Node)) return;

    if (
        !profileDropdown?.contains(target) &&
        !profileBtn?.contains(target)
    ) {
        closeProfileDropdown();
    }
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        closeProfileDropdown();
    }
});


 // Sync the saved display name and profile picture
function updateProfileDisplay(): void {
    const username =
        localStorage.getItem("financeflow-display-name") || "User";

    const photo = localStorage.getItem("financeflow-profile-photo");

    const profileName = document.querySelector<HTMLElement>("#profile-name");
    const profileAvatar = document.querySelector<HTMLElement>("#profile-avatar");
    const dropdownName = document.querySelector<HTMLElement>("#dropdown-name");
    const dropdownAvatar = document.querySelector<HTMLElement>("#dropdown-avatar");

    const initial = username.trim().charAt(0).toUpperCase() || "U";

    if (profileName) profileName.textContent = username;
    if (dropdownName) dropdownName.textContent = username;

    [profileAvatar, dropdownAvatar].forEach((avatar) => {
        if (!avatar) return;

        avatar.replaceChildren();

        if (photo) {
            const image = document.createElement("img");

            image.src = photo;
            image.alt = "Profile picture";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";
            image.style.borderRadius = "50%";

            avatar.appendChild(image);
        } else {
            avatar.textContent = initial;
        }
    });
}

updateProfileDisplay();


const notificationBtn = document.querySelector<HTMLButtonElement>(
    "#notification-btn"
);

const notificationDropdown = document.querySelector<HTMLDivElement>(
    "#notification-dropdown"
);

function closeNotificationDropdown(): void {
    if (notificationDropdown) {
        notificationDropdown.hidden = true;
    }

    notificationBtn?.setAttribute("aria-expanded", "false");
}

function toggleNotificationDropdown(): void {
    if (!notificationBtn || !notificationDropdown) return;

    const isOpen = !notificationDropdown.hidden;

    notificationDropdown.hidden = isOpen;
    notificationBtn.setAttribute("aria-expanded", String(!isOpen));
}

notificationBtn?.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();

    // Close the profile menu when opening notifications.
    closeProfileDropdown();

    toggleNotificationDropdown();
});

notificationDropdown?.addEventListener("click", (event: MouseEvent) => {
    event.stopPropagation();
});

document.addEventListener("click", (event: MouseEvent) => {
    const target = event.target;

    if (!(target instanceof Node)) return;

    if (
        !notificationDropdown?.contains(target) &&
        !notificationBtn?.contains(target)
    ) {
        closeNotificationDropdown();
    }
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape") {
        closeNotificationDropdown();
    }
});


interface DashboardBudget {
    id: string;
    category: string;
    limit: number;
}

function renderNotifications(): void {
    const notificationList = document.querySelector<HTMLDivElement>(
        "#notification-list"
    );

    const notificationCount = document.querySelector<HTMLSpanElement>(
        "#notification-count"
    );

    const notificationDot = document.querySelector<HTMLSpanElement>(
        ".notification-dot"
    );

    if (!notificationList) return;

    const notificationsEnabled =
    localStorage.getItem("financeflow-budget-notifications") !== "false";

if (!notificationsEnabled) {
    notificationList.innerHTML = `
        <div class="notification-empty">
            <i class="fa-regular fa-bell"></i>
            <p>Notifications are turned off.</p>
            <span>Enable Budget Alerts in Settings to see alerts.</span>
        </div>
    `;

    if (notificationCount) notificationCount.textContent = "0";
    if (notificationDot) notificationDot.hidden = true;

    return;
}

    const budgets: DashboardBudget[] = JSON.parse(
        localStorage.getItem("financeflow-budgets") || "[]"
    );

    const savedTransactions = localStorage.getItem(
        "financeflow-transactions"
    );

    const allTransactions: Transaction[] = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];

    const now = new Date();

    const monthlyExpenses = allTransactions.filter((transaction) => {
        const [year, month, day] = transaction.date.split("-").map(Number);
        const date = new Date(year, month - 1, day);

        return (
            transaction.type === "expense" &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    });

    const alerts = budgets
        .map((budget) => {
            const spent = monthlyExpenses
                .filter(
                    (transaction) =>
                        transaction.category.toLowerCase() ===
                        budget.category.toLowerCase()
                )
                .reduce((sum, transaction) => sum + transaction.amount, 0);

            const percentage =
                budget.limit > 0
                    ? (spent / budget.limit) * 100
                    : 0;

            if (percentage < 80) return null;

            const isOverBudget = percentage >= 100;
            const difference = Math.abs(budget.limit - spent);

            return {
                category: budget.category,
                percentage,
                isOverBudget,
                message: isOverBudget
                    ? `You have exceeded this budget by ${formatNaira(difference)}.`
                    : `${formatNaira(budget.limit - spent)} remaining before you reach your limit.`,
            };
        })
        .filter((alert) => alert !== null);

    if (notificationCount) {
        notificationCount.textContent = String(alerts.length);
    }

    if (notificationDot) {
        notificationDot.hidden = alerts.length === 0;
    }

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
            const category =
                alert.category.charAt(0).toUpperCase() +
                alert.category.slice(1);

            return `
                <div class="notification-item ${
                    alert.isOverBudget ? "danger" : "warning"
                }">
                    <div class="notification-item-icon">
                        <i class="fa-solid ${
                            alert.isOverBudget
                                ? "fa-circle-exclamation"
                                : "fa-triangle-exclamation"
                        }"></i>
                    </div>

                    <div class="notification-item-content">
                        <strong>${
                            category
                        } ${
                            alert.isOverBudget
                                ? "budget exceeded"
                                : "budget almost reached"
                        }</strong>

                        <p>${alert.message}</p>

                        <span>${alert.percentage.toFixed(0)}% of budget used</span>
                    </div>
                </div>
            `;
        })
        .join("");
}

renderNotifications();

const bottomAddBtn = document.querySelector(".bottom-nav-add");

bottomAddBtn?.addEventListener("click", () => {
    (document.querySelector(".add-transaction-btn") as HTMLElement | null)?.click();
});

const backModalBtn = document.querySelector("#back-modal");

backModalBtn?.addEventListener("click", () => {
    transactionModal?.classList.remove("show");
});


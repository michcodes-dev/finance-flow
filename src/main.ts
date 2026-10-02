type Transaction = {
    id: string;
    type: string;
    amount: number;
    description: string;
    category: string;
    date: string;
};

const transactions: Transaction[] = [];

const addTransactionBtn = document.querySelector(".add-transaction-btn");
const transactionModal = document.querySelector("#transaction-modal");
addTransactionBtn?.addEventListener("click", () => {
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
function renderTransactions() {
    recentList.innerHTML = "";

    const latest = [...transactions].reverse().slice(0, 5);

    latest.forEach((t) => {
        const row = document.createElement("div");
        row.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "tx-info";

        const title = document.createElement("p");
        title.className = "tx-title";
        title.textContent = t.description;

        const meta = document.createElement("span");
        meta.className = "tx-meta";
        meta.textContent = t.category + " · " + t.date;

        const amount = document.createElement("p");
        amount.className = "tx-amount " + t.type;
        amount.textContent = (t.type === "income" ? "+" : "-") + "₦" + t.amount;

        info.append(title, meta);
        row.append(info, amount);
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

    renderTransactions();

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



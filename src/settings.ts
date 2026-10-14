export {};

const profileForm = document.querySelector<HTMLFormElement>(
    "#profile-settings-form"
);

const displayNameInput = document.querySelector<HTMLInputElement>(
    "#display-name"
);

const budgetNotifications = document.querySelector<HTMLInputElement>(
    "#budget-notifications"
);

const settingsMessage = document.querySelector<HTMLParagraphElement>(
    "#settings-message"
);

const savedName = localStorage.getItem("financeflow-display-name");
const savedNotifications = localStorage.getItem(
    "financeflow-budget-notifications"
);

if (displayNameInput) {
    displayNameInput.value = savedName || "";
}

if (budgetNotifications && savedNotifications !== null) {
    budgetNotifications.checked = savedNotifications === "true";
}

profileForm?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const name = displayNameInput?.value.trim();

    if (!name) return;

    localStorage.setItem("financeflow-display-name", name);

    if (settingsMessage) {
        settingsMessage.textContent = "Settings saved successfully.";
    }
});

budgetNotifications?.addEventListener("change", () => {
    localStorage.setItem(
        "financeflow-budget-notifications",
        String(budgetNotifications.checked)
    );
});
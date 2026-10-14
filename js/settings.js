const profileForm = document.querySelector("#profile-settings-form");
const displayNameInput = document.querySelector("#display-name");
const budgetNotifications = document.querySelector("#budget-notifications");
const settingsMessage = document.querySelector("#settings-message");
const savedName = localStorage.getItem("financeflow-display-name");
const savedNotifications = localStorage.getItem("financeflow-budget-notifications");
if (displayNameInput) {
    displayNameInput.value = savedName || "";
}
if (budgetNotifications && savedNotifications !== null) {
    budgetNotifications.checked = savedNotifications === "true";
}
profileForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = displayNameInput?.value.trim();
    if (!name)
        return;
    localStorage.setItem("financeflow-display-name", name);
    if (settingsMessage) {
        settingsMessage.textContent = "Settings saved successfully.";
    }
});
budgetNotifications?.addEventListener("change", () => {
    localStorage.setItem("financeflow-budget-notifications", String(budgetNotifications.checked));
});
export {};

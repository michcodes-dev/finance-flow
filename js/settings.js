const nameKey = "financeflow-display-name";
const photoKey = "financeflow-profile-photo";
const notificationsKey = "financeflow-budget-notifications";
const transactionsKey = "financeflow-transactions";
const budgetsKey = "financeflow-budgets";
/* ---------- Elements ---------- */
const settingsAvatar = document.querySelector("#settings-avatar");
const settingsName = document.querySelector("#settings-name");
const previewAvatar = document.querySelector("#profile-preview-avatar");
const profileModal = document.querySelector("#profile-modal");
const openProfileBtn = document.querySelector("#open-edit-profile");
const closeProfileBtn = document.querySelector("#close-profile-modal");
const cancelProfileBtn = document.querySelector("#cancel-profile-edit");
const profileForm = document.querySelector("#edit-profile-form");
const nameInput = document.querySelector("#edit-display-name");
const photoInput = document.querySelector("#profile-photo");
const removePhotoBtn = document.querySelector("#remove-profile-photo");
const profileMessage = document.querySelector("#profile-form-message");
const budgetNotifications = document.querySelector("#budget-notifications");
const exportBtn = document.querySelector("#export-btn");
const clearBtn = document.querySelector("#clear-btn");
const clearModal = document.querySelector("#clear-data-modal");
const cancelClearBtn = document.querySelector("#cancel-clear");
const confirmClearBtn = document.querySelector("#confirm-clear");
const settingsMessage = document.querySelector("#settings-message");
let selectedPhoto = localStorage.getItem(photoKey);
function showMessage(text) {
    if (settingsMessage)
        settingsMessage.textContent = text;
}
/* ---------- Profile ---------- */
function renderProfile() {
    const name = localStorage.getItem(nameKey)?.trim() || "User";
    const initial = name.charAt(0).toUpperCase() || "U";
    if (settingsName)
        settingsName.textContent = name;
    [settingsAvatar, previewAvatar].forEach((avatar) => {
        if (!avatar)
            return;
        avatar.replaceChildren();
        if (selectedPhoto) {
            const image = document.createElement("img");
            image.src = selectedPhoto;
            image.alt = "Profile picture";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";
            image.style.borderRadius = "50%";
            avatar.append(image);
        }
        else {
            avatar.textContent = initial;
        }
    });
}
function openProfileModal() {
    if (!profileModal || !nameInput)
        return;
    nameInput.value = localStorage.getItem(nameKey) || "";
    if (photoInput)
        photoInput.value = "";
    if (profileMessage)
        profileMessage.textContent = "";
    selectedPhoto = localStorage.getItem(photoKey);
    renderProfile();
    profileModal.hidden = false;
    nameInput.focus();
}
function closeProfileModal() {
    if (profileModal)
        profileModal.hidden = true;
    if (photoInput)
        photoInput.value = "";
    selectedPhoto = localStorage.getItem(photoKey);
    renderProfile();
}
openProfileBtn?.addEventListener("click", openProfileModal);
closeProfileBtn?.addEventListener("click", closeProfileModal);
cancelProfileBtn?.addEventListener("click", closeProfileModal);
profileModal?.addEventListener("click", (event) => {
    if (event.target === profileModal)
        closeProfileModal();
});
photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file)
        return;
    if (!file.type.startsWith("image/")) {
        if (profileMessage)
            profileMessage.textContent = "Please choose an image file.";
        photoInput.value = "";
        return;
    }
    // Keep localStorage usage reasonable.
    if (file.size > 1000000) {
        if (profileMessage)
            profileMessage.textContent = "Choose an image smaller than 1 MB.";
        photoInput.value = "";
        return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        if (typeof reader.result !== "string")
            return;
        selectedPhoto = reader.result;
        renderProfile();
        if (profileMessage)
            profileMessage.textContent = "";
    });
    reader.readAsDataURL(file);
});
removePhotoBtn?.addEventListener("click", () => {
    selectedPhoto = null;
    if (photoInput)
        photoInput.value = "";
    renderProfile();
    if (profileMessage) {
        profileMessage.textContent = "Profile picture will be removed when saved.";
    }
});
profileForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput?.value.trim();
    if (!name) {
        if (profileMessage)
            profileMessage.textContent = "Please enter a display name.";
        return;
    }
    try {
        localStorage.setItem(nameKey, name);
        if (selectedPhoto) {
            localStorage.setItem(photoKey, selectedPhoto);
        }
        else {
            localStorage.removeItem(photoKey);
        }
        closeProfileModal();
        showMessage("Profile saved successfully.");
    }
    catch {
        if (profileMessage) {
            profileMessage.textContent = "Could not save your profile. Try a smaller image.";
        }
    }
});
/* ---------- Notifications ---------- */
const savedNotifications = localStorage.getItem(notificationsKey);
if (budgetNotifications && savedNotifications !== null) {
    budgetNotifications.checked = savedNotifications === "true";
}
budgetNotifications?.addEventListener("change", () => {
    localStorage.setItem(notificationsKey, String(budgetNotifications.checked));
});
/* ---------- Export transactions (CSV) ---------- */
function csvCell(value) {
    let text = String(value);
    // Stops spreadsheets from running text that starts like a formula.
    if (typeof value === "string" && /^[=+\-@]/.test(text)) {
        text = `'${text}`;
    }
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
exportBtn?.addEventListener("click", () => {
    const transactions = JSON.parse(localStorage.getItem(transactionsKey) || "[]");
    if (transactions.length === 0) {
        showMessage("There are no transactions to export yet.");
        return;
    }
    const rows = [
        ["Date", "Type", "Category", "Description", "Amount"],
        ...transactions.map((t) => [t.date, t.type, t.category, t.description, t.amount]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeflow-transactions-${new Date().toLocaleDateString("en-CA")}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("Your transactions were exported.");
});
/* ---------- Clear all data ---------- */
clearBtn?.addEventListener("click", () => clearModal?.classList.add("show"));
cancelClearBtn?.addEventListener("click", () => clearModal?.classList.remove("show"));
clearModal?.addEventListener("click", (event) => {
    if (event.target === clearModal)
        clearModal.classList.remove("show");
});
confirmClearBtn?.addEventListener("click", () => {
    localStorage.removeItem(transactionsKey);
    localStorage.removeItem(budgetsKey);
    clearModal?.classList.remove("show");
    showMessage("All transactions and budgets were cleared.");
});
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape")
        return;
    clearModal?.classList.remove("show");
    if (profileModal && !profileModal.hidden)
        closeProfileModal();
});
renderProfile();
export {};

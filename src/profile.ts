
export {};

const nameKey = "financeflow-display-name";
const photoKey = "financeflow-profile-photo";

const pageName = document.querySelector<HTMLElement>("#profile-page-name");
const pageAvatar = document.querySelector<HTMLElement>("#profile-page-avatar");
const displayName = document.querySelector<HTMLElement>("#profile-display-name");
const previewAvatar = document.querySelector<HTMLElement>("#profile-preview-avatar");

const modal = document.querySelector<HTMLDivElement>("#profile-modal");
const openButton = document.querySelector<HTMLButtonElement>("#open-edit-profile");
const closeButton = document.querySelector<HTMLButtonElement>("#close-profile-modal");
const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-profile-edit");
const form = document.querySelector<HTMLFormElement>("#edit-profile-form");
const nameInput = document.querySelector<HTMLInputElement>("#edit-display-name");
const photoInput = document.querySelector<HTMLInputElement>("#profile-photo");
const removePhotoButton = document.querySelector<HTMLButtonElement>("#remove-profile-photo");
const message = document.querySelector<HTMLElement>("#profile-form-message");

let selectedPhoto: string | null = localStorage.getItem(photoKey);

function renderProfile(): void {
    const name = localStorage.getItem(nameKey)?.trim() || "User";
    const initial = name.charAt(0).toUpperCase() || "U";

    if (pageName) pageName.textContent = name;
    if (displayName) displayName.textContent = name;

    [pageAvatar, previewAvatar].forEach((avatar) => {
        if (!avatar) return;

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
        } else {
            avatar.textContent = initial;
        }
    });
}

function openModal(): void {
    if (!modal || !nameInput) return;

    nameInput.value = localStorage.getItem(nameKey) || "";
    if (photoInput) photoInput.value = "";
    if (message) message.textContent = "";

    selectedPhoto = localStorage.getItem(photoKey);
    renderProfile();

    modal.hidden = false;
    nameInput.focus();
}

function closeModal(): void {
    if (modal) modal.hidden = true;
    if (photoInput) photoInput.value = "";
    selectedPhoto = localStorage.getItem(photoKey);
    renderProfile();
}

openButton?.addEventListener("click", openModal);
closeButton?.addEventListener("click", closeModal);
cancelButton?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event: MouseEvent) => {
    if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && modal && !modal.hidden) closeModal();
});

photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        if (message) message.textContent = "Please choose an image file.";
        photoInput.value = "";
        return;
    }

    // Keep localStorage usage reasonable.
    if (file.size > 1_000_000) {
        if (message) message.textContent = "Choose an image smaller than 1 MB.";
        photoInput.value = "";
        return;
    }

    const reader = new FileReader();

    reader.addEventListener("load", () => {
        if (typeof reader.result !== "string") return;

        selectedPhoto = reader.result;
        renderProfile();

        if (message) message.textContent = "";
    });

    reader.readAsDataURL(file);
});

removePhotoButton?.addEventListener("click", () => {
    selectedPhoto = null;
    if (photoInput) photoInput.value = "";
    renderProfile();

    if (message) message.textContent = "Profile picture will be removed when saved.";
});

form?.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    const name = nameInput?.value.trim();

    if (!name) {
        if (message) message.textContent = "Please enter a display name.";
        return;
    }

    try {
        localStorage.setItem(nameKey, name);

        if (selectedPhoto) {
            localStorage.setItem(photoKey, selectedPhoto);
        } else {
            localStorage.removeItem(photoKey);
        }

        renderProfile();

        if (message) message.textContent = "Profile saved successfully.";
        closeModal();
    } catch {
        if (message) {
            message.textContent =
                "Could not save your profile. Try a smaller image.";
        }
    }
});

renderProfile();

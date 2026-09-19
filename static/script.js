"use strict";


/* =========================================================
   ELEMENTS
   ========================================================= */

const fileInput =
    document.getElementById("fileInput");

const chooseFilesButton =
    document.getElementById("chooseFilesButton");

const dropZone =
    document.getElementById("dropZone");

const uploadStatus =
    document.getElementById("uploadStatus");

const cardsSection =
    document.getElementById("cardsSection");

const cardsContainer =
    document.getElementById("cardsContainer");

const cardCount =
    document.getElementById("cardCount");

const clearAllButton =
    document.getElementById("clearAllButton");


const settingsButton =
    document.getElementById("settingsButton");

const settingsOverlay =
    document.getElementById("settingsOverlay");

const closeSettingsButton =
    document.getElementById("closeSettingsButton");

const closeSettingsButton2 =
    document.getElementById("closeSettingsButton2");

const saveSettingsButton =
    document.getElementById("saveSettingsButton");

const geminiApiKey =
    document.getElementById("geminiApiKey");

const googleSheetUrl =
    document.getElementById("googleSheetUrl");

const googleCredentialsPath =
    document.getElementById("googleCredentialsPath");

const toggleApiKey =
    document.getElementById("toggleApiKey");

const geminiStatus =
    document.getElementById("geminiStatus");

const settingsStatus =
    document.getElementById("settingsStatus");


const cardModal =
    document.getElementById("cardModal");

const closeCardModal =
    document.getElementById("closeCardModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalBody =
    document.getElementById("modalBody");


/* =========================================================
   STATE
   ========================================================= */

let cards = [];


/* =========================================================
   UTIL
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return ".";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showStatus(
    message,
    type = "normal"
) {

    uploadStatus.textContent = message;

    uploadStatus.classList.remove(
        "hidden"
    );

    if (type === "error") {

        uploadStatus.style.background =
            "#fef2f2";

        uploadStatus.style.color =
            "#dc2626";

    } else {

        uploadStatus.style.background =
            "#eff6ff";

        uploadStatus.style.color =
            "#1d4ed8";
    }
}


function hideStatus() {

    uploadStatus.classList.add(
        "hidden"
    );
}


function getUploadMode() {

    const selected =
        document.querySelector(
            'input[name="uploadMode"]:checked'
        );

    return selected
        ? selected.value
        : "single";
}


/* =========================================================
   FILE SELECT
   ========================================================= */

chooseFilesButton.addEventListener(
    "click",
    () => {
        fileInput.click();
    }
);


fileInput.addEventListener(
    "change",
    async () => {

        const files =
            Array.from(
                fileInput.files || []
            );

        if (!files.length) {
            return;
        }

        await uploadFiles(files);
    }
);


/* =========================================================
   DRAG DROP
   ========================================================= */

dropZone.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        dropZone.classList.add(
            "dragover"
        );
    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "dragover"
        );
    }
);


dropZone.addEventListener(
    "drop",
    async (event) => {

        event.preventDefault();

        dropZone.classList.remove(
            "dragover"
        );

        const files =
            Array.from(
                event.dataTransfer.files || []
            ).filter(
                file =>
                    file.type.startsWith(
                        "image/"
                    )
            );

        if (!files.length) {

            showStatus(
                "Không tìm thấy file ảnh.",
                "error"
            );

            return;
        }

        await uploadFiles(files);
    }
);


/* =========================================================
   UPLOAD
   ========================================================= */

async function uploadFiles(files) {

    const mode =
        getUploadMode();

    if (
        mode === "two-sided" &&
        files.length % 2 !== 0
    ) {

        showStatus(
            "Chế độ 2 mặt yêu cầu số lượng ảnh phải là số chẵn.",
            "error"
        );

        return;
    }


    const formData =
        new FormData();


    files.forEach(
        file => {

            formData.append(
                "files",
                file
            );
        }
    );


    formData.append(
        "mode",
        mode
    );


    showStatus(
        `Đang upload ${files.length} ảnh...`
    );


    try {

        const response =
            await fetch(
                "/upload-batch",
                {
                    method: "POST",
                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Upload thất bại."
            );
        }


        if (
            !result.cards ||
            !Array.isArray(result.cards)
        ) {

            throw new Error(
                "Server không trả về danh sách card."
            );
        }


        cards.push(
            ...result.cards
        );


        renderCards();


        hideStatus();


        // Tự động OCR từng card
        for (
            const card of result.cards
        ) {

            await processCard(
                card.id
            );
        }


    } catch (error) {

        console.error(
            error
        );

        showStatus(
            error.message ||
            "Upload thất bại.",
            "error"
        );
    }
}


/* =========================================================
   PROCESS OCR
   ========================================================= */

async function processCard(
    cardId
) {

    const card =
        cards.find(
            item =>
                item.id === cardId
        );

    if (card) {

        card.status =
            "processing";

        renderCards();
    }


    try {

        const response =
            await fetch(
                `/process/${encodeURIComponent(cardId)}`,
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "OCR thất bại."
            );
        }


        const processedCard =
            result.card;


        const index =
            cards.findIndex(
                item =>
                    item.id === cardId
            );


        if (index !== -1) {

            cards[index] =
                processedCard;
        }


        renderCards();


    } catch (error) {

        console.error(
            "OCR ERROR:",
            error
        );


        const currentCard =
            cards.find(
                item =>
                    item.id === cardId
            );


        if (currentCard) {

            currentCard.status =
                "error";

            currentCard.error =
                error.message;
        }


        renderCards();
    }
}


/* =========================================================
   CARD RENDER
   ========================================================= */

function renderCards() {

    if (!cards.length) {

        cardsSection.classList.add(
            "hidden"
        );

        return;
    }


    cardsSection.classList.remove(
        "hidden"
    );


    cardCount.textContent =
        `${cards.length} card${
            cards.length > 1
                ? "s"
                : ""
        }`;


    cardsContainer.innerHTML =
        cards
            .map(
                (card, index) =>
                    renderCard(
                        card,
                        index
                    )
            )
            .join("");
}


function renderCard(
    card,
    index
) {

    const data =
        card.data || {};


    const images =
        Array.isArray(card.images)
            ? card.images
            : [];


    const imageClass =
        images.length <= 1
            ? "card-images single"
            : "card-images";


    const imageHtml =
        images
            .map(
                imageUrl => {

                    // Quan trọng:
                    // Không còn tạo /undefined
                    const safeUrl =
                        imageUrl ||
                        "";

                    return `
                        <div class="card-image-wrapper">
                            ${
                                safeUrl
                                    ? `
                                    <img
                                        src="${escapeHtml(safeUrl)}"
                                        alt="Business Card"
                                    >
                                    `
                                    : `
                                    <div>
                                        No image
                                    </div>
                                    `
                            }
                        </div>
                    `;
                }
            )
            .join("");


    const status =
        card.status ||
        "pending";


    let statusText =
        "Pending";


    if (
        status === "processing"
    ) {
        statusText =
            "Processing...";
    }

    if (
        status === "processed"
    ) {
        statusText =
            "Processed";
    }

    if (
        status === "saved"
    ) {
        statusText =
            "Saved";
    }

    if (
        status === "error"
    ) {
        statusText =
            "Error";
    }


    const rows = [
        ["Name", data.name],
        ["Job Title", data.job_title],
        ["Company VN", data.company_vietnamese],
        ["Company EN", data.company_english],
        ["TEL 1", data.tel_1],
        ["TEL 2", data.tel_2],
        ["Mobile 1", data.mobile_1],
        ["Mobile 2", data.mobile_2],
        ["Email 1", data.email_1],
        ["Email 2", data.email_2],
        ["Website", data.website],
        ["Address", data.address],
        ["Province", data.province],
        ["Country", data.country]
    ];


    const dataHtml =
        rows
            .map(
                ([label, value]) => `
                    <div class="data-row">
                        <div class="data-label">
                            ${label}
                        </div>

                        <div class="data-value">
                            ${escapeHtml(
                                value || "."
                            )}
                        </div>
                    </div>
                `
            )
            .join("");


    return `
        <div class="business-card">

            <div class="card-top">

                <div class="card-number">
                    Card ${index + 1}
                </div>

                <div class="card-status ${escapeHtml(status)}">
                    ${statusText}
                </div>

            </div>


            <div class="${imageClass}">
                ${imageHtml}
            </div>


            <div class="card-data">

                ${dataHtml}

                ${
                    card.error
                        ? `
                        <div
                            style="
                                margin-top:10px;
                                color:#dc2626;
                                font-size:12px;
                            "
                        >
                            ${escapeHtml(
                                card.error
                            )}
                        </div>
                        `
                        : ""
                }

            </div>


            <div class="card-actions">

                <button
                    class="secondary-button"
                    onclick="editCard('${escapeHtml(card.id)}')"
                >
                    Edit
                </button>

                <button
                    class="primary-button"
                    ${
                        status === "processing"
                            ? "disabled"
                            : ""
                    }
                    onclick="saveCard('${escapeHtml(card.id)}')"
                >
                    Save
                </button>

                <button
                    class="secondary-button"
                    onclick="deleteCard('${escapeHtml(card.id)}')"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}


/* =========================================================
   EDIT CARD
   ========================================================= */

window.editCard = function (
    cardId
) {

    const card =
        cards.find(
            item =>
                item.id === cardId
        );

    if (!card) {
        return;
    }


    const data =
        card.data || {};


    modalTitle.textContent =
        "Edit Business Card";


    const fields = [
        ["name", "Name"],
        ["job_title", "Job Title"],
        ["company_vietnamese", "Company VN"],
        ["company_english", "Company EN"],
        ["tel_1", "TEL 1"],
        ["tel_2", "TEL 2"],
        ["mobile_1", "Mobile 1"],
        ["mobile_2", "Mobile 2"],
        ["email_1", "Email 1"],
        ["email_2", "Email 2"],
        ["website", "Website"],
        ["address", "Address"],
        ["province", "Province"],
        ["country", "Country"]
    ];


    modalBody.innerHTML = `
        <div class="edit-form">

            ${
                fields
                    .map(
                        ([key, label]) => `
                            <div class="form-group ${
                                key === "address"
                                    ? "full"
                                    : ""
                            }">

                                <label>
                                    ${label}
                                </label>

                                <input
                                    data-field="${key}"
                                    value="${escapeHtml(
                                        data[key] || "."
                                    )}"
                                >

                            </div>
                        `
                    )
                    .join("")
            }

        </div>

        <div
            style="
                margin-top:20px;
                display:flex;
                justify-content:flex-end;
                gap:8px;
            "
        >

            <button
                class="secondary-button"
                id="cancelEdit"
            >
                Cancel
            </button>

            <button
                class="primary-button"
                id="saveEdit"
            >
                Save Changes
            </button>

        </div>
    `;


    cardModal.classList.remove(
        "hidden"
    );


    document
        .getElementById("cancelEdit")
        .addEventListener(
            "click",
            () => {
                cardModal.classList.add(
                    "hidden"
                );
            }
        );


    document
        .getElementById("saveEdit")
        .addEventListener(
            "click",
            async () => {

                const newData = {};


                modalBody
                    .querySelectorAll(
                        "[data-field]"
                    )
                    .forEach(
                        input => {

                            newData[
                                input.dataset.field
                            ] =
                                input.value.trim() ||
                                ".";
                        }
                    );


                try {

                    const response =
                        await fetch(
                            `/card/${encodeURIComponent(cardId)}`,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        newData
                                    )
                            }
                        );


                    const result =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            result.detail ||
                            "Không thể cập nhật."
                        );
                    }


                    const index =
                        cards.findIndex(
                            item =>
                                item.id === cardId
                        );


                    if (index !== -1) {

                        cards[index] =
                            result.card;
                    }


                    cardModal.classList.add(
                        "hidden"
                    );


                    renderCards();


                } catch (error) {

                    alert(
                        error.message
                    );
                }
            }
        );
};


/* =========================================================
   SAVE CARD
   ========================================================= */

window.saveCard = async function (
    cardId
) {

    const card =
        cards.find(
            item =>
                item.id === cardId
        );


    if (!card) {
        return;
    }


    try {

        const response =
            await fetch(
                `/cards/${encodeURIComponent(cardId)}/save`,
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Không thể lưu Google Sheet."
            );
        }


        card.status =
            "saved";


        renderCards();


        alert(
            "Đã lưu vào Google Sheet."
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            error.message
        );
    }
};


/* =========================================================
   DELETE CARD
   ========================================================= */

window.deleteCard = async function (
    cardId
) {

    const confirmed =
        confirm(
            "Bạn có chắc muốn xóa card này?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/card/${encodeURIComponent(cardId)}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Không thể xóa card."
            );
        }


        cards =
            cards.filter(
                item =>
                    item.id !== cardId
            );


        renderCards();


    } catch (error) {

        alert(
            error.message
        );
    }
};


/* =========================================================
   CLEAR ALL
   ========================================================= */

clearAllButton.addEventListener(
    "click",
    async () => {

        if (!cards.length) {
            return;
        }


        const confirmed =
            confirm(
                "Bạn có chắc muốn xóa tất cả card?"
            );


        if (!confirmed) {
            return;
        }


        const ids =
            cards.map(
                card =>
                    card.id
            );


        for (
            const id of ids
        ) {

            try {

                await fetch(
                    `/card/${encodeURIComponent(id)}`,
                    {
                        method: "DELETE"
                    }
                );

            } catch (error) {

                console.error(
                    error
                );
            }
        }


        cards = [];

        renderCards();
    }
);


/* =========================================================
   SETTINGS
   ========================================================= */

settingsButton.addEventListener(
    "click",
    async () => {

        settingsOverlay.classList.remove(
            "hidden"
        );

        await loadSettings();
    }
);


function closeSettings() {

    settingsOverlay.classList.add(
        "hidden"
    );
}


closeSettingsButton.addEventListener(
    "click",
    closeSettings
);


closeSettingsButton2.addEventListener(
    "click",
    closeSettings
);


settingsOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            settingsOverlay
        ) {
            closeSettings();
        }
    }
);


/* =========================================================
   LOAD SETTINGS
   ========================================================= */

async function loadSettings() {

    settingsStatus.textContent =
        "Loading...";


    try {

        // ĐÚNG API:
        // /api/settings
        const response =
            await fetch(
                "/api/settings"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.detail ||
                "Không thể đọc Settings."
            );
        }


        const settings =
            result.settings || {};


        googleSheetUrl.value =
            settings.google_sheet_url ||
            "";


        googleCredentialsPath.value =
            settings.google_credentials_path ||
            "";


        geminiApiKey.value =
            "";


        if (
            settings.gemini_configured
        ) {

            geminiStatus.textContent =
                "Gemini API Key đã được cấu hình.";

            geminiStatus.style.color =
                "#047857";

        } else {

            geminiStatus.textContent =
                "Chưa cấu hình Gemini API Key.";

            geminiStatus.style.color =
                "#dc2626";
        }


        settingsStatus.textContent =
            "";


    } catch (error) {

        console.error(
            error
        );

        settingsStatus.textContent =
            error.message;

        settingsStatus.style.color =
            "#dc2626";
    }
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

saveSettingsButton.addEventListener(
    "click",
    async () => {

        settingsStatus.textContent =
            "Saving...";

        settingsStatus.style.color =
            "#2563eb";


        const payload = {

            gemini_api_key:
                geminiApiKey.value.trim(),

            google_sheet_url:
                googleSheetUrl.value.trim(),

            google_credentials_path:
                googleCredentialsPath.value.trim()
        };


        try {

            // ĐÚNG API:
            // /api/settings
            const response =
                await fetch(
                    "/api/settings",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.detail ||
                    "Không thể lưu Settings."
                );
            }


            settingsStatus.textContent =
                "Đã lưu Settings.";

            settingsStatus.style.color =
                "#047857";


            geminiApiKey.value =
                "";


            await loadSettings();


            setTimeout(
                () => {

                    settingsStatus.textContent =
                        "";

                },
                2000
            );


        } catch (error) {

            console.error(
                error
            );

            settingsStatus.textContent =
                error.message;

            settingsStatus.style.color =
                "#dc2626";
        }
    }
);


/* =========================================================
   TOGGLE API KEY
   ========================================================= */

toggleApiKey.addEventListener(
    "click",
    () => {

        if (
            geminiApiKey.type ===
            "password"
        ) {

            geminiApiKey.type =
                "text";

            toggleApiKey.textContent =
                "Hide";

        } else {

            geminiApiKey.type =
                "password";

            toggleApiKey.textContent =
                "Show";
        }
    }
);


/* =========================================================
   CARD MODAL
   ========================================================= */

closeCardModal.addEventListener(
    "click",
    () => {

        cardModal.classList.add(
            "hidden"
        );
    }
);


cardModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            cardModal
        ) {

            cardModal.classList.add(
                "hidden"
            );
        }
    }
);


/* =========================================================
   HEALTH CHECK
   ========================================================= */

async function checkHealth() {

    try {

        const response =
            await fetch(
                "/api/health"
            );


        const result =
            await response.json();


        console.log(
            "Server health:",
            result
        );

    } catch (error) {

        console.error(
            "Health check failed:",
            error
        );
    }
}


/* =========================================================
   INIT
   ========================================================= */

renderCards();

checkHealth();
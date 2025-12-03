// === Aktualizace data v hlavičce ===
function updateHeaderDate() {
    const now = new Date();
    const formatted = now.toLocaleDateString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
    document.getElementById("headerDate").textContent = formatted;
}
updateHeaderDate();

// === Otevírání jednotlivých šuplíků ===
document.querySelectorAll(".menu-tile").forEach(tile => {
    tile.addEventListener("click", () => {
        const target = tile.dataset.target;
        if (target) {
            window.location.href = `${target}.html`;
        }
    });
});

// === Uložení poznámek ===
function saveNotes() {
    const text = document.getElementById("notesText").value;
    localStorage.setItem("equity_notes", text);

    const info = document.getElementById("notesInfo");
    info.textContent = "Uloženo ✔";
    setTimeout(() => (info.textContent = "Automaticky ukládám každých pár sekund…"), 2000);
}

document.getElementById("btnSaveNotes")?.addEventListener("click", saveNotes);

// === Automatické načtení poznámek ===
if (localStorage.getItem("equity_notes")) {
    document.getElementById("notesText").value = localStorage.getItem("equity_notes");
}

// === Automatické ukládání každých 5 sekund ===
setInterval(() => {
    const textarea = document.getElementById("notesText");
    if (textarea) {
        localStorage.setItem("equity_notes", textarea.value);
    }
}, 5000);

// === Otevřít modal grafu ===
function openChartModal(ticker) {
    const modal = document.getElementById("chartModal");
    const title = document.getElementById("chartTitle");

    title.textContent = `Graf – ${ticker}`;
    modal.classList.add("active");

    loadChart(ticker);
}

// === Zavřít modal ===
document.getElementById("chartModalClose")?.addEventListener("click", () => {
    document.getElementById("chartModal").classList.remove("active");
});

// === Načtení dat grafu z YF (DEMO verze) ===
async function loadChart(ticker) {
    const canvas = document.getElementById("chartCanvas");
    const ctx = canvas.getContext("2d");

    // Dummy demo hodnoty
    const labels = [];
    const prices = [];

    for (let i = 0; i < 60; i++) {
        labels.push(`Den ${i + 1}`);
        prices.push(100 + Math.sin(i / 6) * 4 + Math.random() * 3);
    }

    if (window.chartInstance) window.chartInstance.destroy();

    window.chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: ticker,
                    data: prices,
                    borderWidth: 2,
                    fill: false,
                    borderColor: "#7c5cff"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// === WATCHLIST: kliknutí na řádek otevře graf ===
document.querySelectorAll(".watchlist-row").forEach(row => {
    row.addEventListener("click", () => {
        const ticker = row.dataset.ticker;
        openChartModal(ticker);
    });
});

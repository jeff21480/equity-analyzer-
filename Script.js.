// Jednoduchý DCF výpočet na akcii
// Všechna data se berou z formuláře, žádné API (zatím).

function percentToDecimal(value) {
    return Number(value) / 100;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("dcf-form");
    const resultBox = document.getElementById("dcf-result");
    const elTicker = document.getElementById("result-ticker");
    const elFair = document.getElementById("result-fair-value");
    const elBuy = document.getElementById("result-buy-price");
    const elCur1 = document.getElementById("result-currency");
    const elCur2 = document.getElementById("result-currency-2");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const ticker = form.ticker.value.trim().toUpperCase();
        const currency = form.currency.value;

        const fcf0 = Number(form.fcf0.value);
        const growth = percentToDecimal(form.growth.value);
        const years = Number(form.years.value);
        const discount = percentToDecimal(form.discount.value);
        const terminal = percentToDecimal(form.terminal.value);
        const mos = percentToDecimal(form.mos.value || 0);

        if (
            !ticker ||
            !isFinite(fcf0) ||
            !isFinite(growth) ||
            !isFinite(years) ||
            !isFinite(discount) ||
            !isFinite(terminal)
        ) {
            alert("Prosím vyplň všechny povinné hodnoty.");
            return;
        }

        if (discount <= terminal) {
            alert("Diskontní sazba musí být vyšší než terminální růst.");
            return;
        }

        // 1) Současná hodnota cash flow v jednotlivých letech
        let pv = 0;
        let fcf = fcf0;

        for (let t = 1; t <= years; t++) {
            fcf = fcf * (1 + growth);
            const discounted = fcf / Math.pow(1 + discount, t);
            pv += discounted;
        }

        // 2) Terminální hodnota po posledním roce
        const fcfTerminal = fcf * (1 + terminal);
        const terminalValue = fcfTerminal / (discount - terminal);
        const terminalPV = terminalValue / Math.pow(1 + discount, years);

        const intrinsicValue = pv + terminalPV; // férová cena na akcii
        const buyPrice = intrinsicValue * (1 - mos);

        const roundedFair = intrinsicValue.toFixed(2);
        const roundedBuy = buyPrice.toFixed(2);

        // Zobrazení výsledku
        elTicker.textContent = ticker ? ` (${ticker})` : "";
        elFair.textContent = roundedFair;
        elBuy.textContent = roundedBuy;
        elCur1.textContent = currency;
        elCur2.textContent = currency;

        resultBox.classList.remove("hidden");
        resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

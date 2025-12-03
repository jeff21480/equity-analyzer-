function toggleBox(box) {
    let content = box.querySelector(".box-content");
    content.style.display = content.style.display === "block" ? "none" : "block";
}

function analyzeTicker() {
    let ticker = document.getElementById("tickerInput").value.toUpperCase();
    if (!ticker) {
        document.getElementById("result").innerText = "Zadej prosím ticker.";
        return;
    }

    document.getElementById("result").innerText =
        "Robot zatím není napojený na internet, ale později automaticky zjistí férovou cenu pro " + ticker + ".";
}

function calculateDCF() {
    let fcf = parseFloat(document.getElementById("fcf").value);
    let growth = parseFloat(document.getElementById("growth").value) / 100;
    let years = parseInt(document.getElementById("years").value);
    let discount = parseFloat(document.getElementById("discount").value) / 100;
    let terminal = parseFloat(document.getElementById("terminal").value) / 100;
    let mos = parseFloat(document.getElementById("mos").value) / 100;

    if (isNaN(fcf) || isNaN(growth) || isNaN(years)) {
        document.getElementById("dcfResult").innerText = "Vyplň všechna pole.";
        return;
    }

    let sum = 0;
    let current = fcf;

    for (let i = 1; i <= years; i++) {
        current *= (1 + growth);
        sum += current / Math.pow(1 + discount, i);
    }

    let terminalValue = (current * (1 + terminal)) / (discount - terminal);
    terminalValue = terminalValue / Math.pow(1 + discount, years);

    let fairValue = sum + terminalValue;
    let safeValue = fairValue * (1 - mos);

    document.getElementById("dcfResult").innerHTML =
        `Férová cena: <b>${fairValue.toFixed(2)}</b><br>
         Cena po bezpečnostní rezervě: <b>${safeValue.toFixed(2)}</b>`;
}

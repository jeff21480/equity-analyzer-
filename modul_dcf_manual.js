// modul_dcf_manual.js
// Manuální 10-bodový DCF model pro tile data-module="intrinsic-quick"

(function () {
  console.log("Manual DCF module loaded");

  document.addEventListener("DOMContentLoaded", function () {
    const panelBox = document.getElementById("main-panel-box");
    const tile = document.querySelector('.tile[data-module="intrinsic-quick"]');

    if (!panelBox || !tile) {
      console.warn("Manual DCF: panel or tile not found.");
      return;
    }

    tile.addEventListener("click", function () {
      renderManualDCF(panelBox);
    });
  });

  function renderManualDCF(panelBox) {
    panelBox.innerHTML = `
      <div class="panel-selected">
        Vybráno: <strong>Manuální DCF model</strong>
      </div>

      <div style="font-size:11px; color:#a0a0c2; margin-bottom:8px;">
        Vyplň ručně vstupní hodnoty. Model spočítá férovou cenu akcie na základě
        10 let diskontovaných FCF (dvě růstové fáze) a terminální hodnoty přes násobek P/FCF.
      </div>

      <div style="display:flex; flex-direction:column; gap:6px; font-size:11px;">
        ${renderField("1) Výchozí FCF (v mil.)", "dcf_fcf", "number", "1500")}
        ${renderField("2) Růst 1–5 let (%)", "dcf_g1", "number", "15")}
        ${renderField("3) Růst 6–10 let (%)", "dcf_g2", "number", "8")}
        ${renderField("4) Diskontní sazba (%)", "dcf_r", "number", "9")}
        ${renderField("5) Terminální násobek P/FCF", "dcf_terminal", "number", "15")}
        ${renderField("6) Čistý dluh (záporný = hotovost)", "dcf_debt", "number", "-200")}
        ${renderField("7) Počet akcií (v mil.)", "dcf_shares", "number", "500")}
        ${renderField("8) Bezpečnostní marže (%)", "dcf_margin", "number", "25")}
        ${renderField("9) Aktuální cena akcie (volitelné)", "dcf_price", "number", "")}
        ${renderField("10) Měna", "dcf_currency", "text", "USD")}
      </div>

      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button id="dcf_calc" style="
          padding:6px 10px;
          border-radius:999px;
          border:1px solid rgba(148,163,255,0.8);
          background:linear-gradient(135deg,#4f46e5,#7c3aed);
          color:white;
          font-size:11px;
          cursor:pointer;
        ">⚙️ Spočítat férovou cenu</button>

        <button id="dcf_clear" style="
          padding:6px 10px;
          border-radius:999px;
          border:1px solid rgba(148,163,255,0.5);
          background:rgba(15,23,42,0.9);
          color:#e5e7eb;
          font-size:11px;
          cursor:pointer;
        ">Vymazat</button>
      </div>

      <div id="dcf_result" style="
        margin-top:10px;
        border-radius:12px;
        border:1px solid rgba(30,64,175,0.9);
        background:radial-gradient(circle at top left,#020617,#020617);
        padding:10px;
        font-size:11px;
        color:#e5e7eb;
        display:none;
      "></div>
    `;

    initLogic();
  }

  function renderField(label, id, type, placeholder) {
    return `
      <label style="display:flex; flex-direction:column; gap:2px;">
        <span style="color:#e5e7eb;">${label}</span>
        <input
          id="${id}"
          type="${type}"
          placeholder="${placeholder}"
          style="
            padding:5px 7px;
            border-radius:8px;
            border:1px solid rgba(55,65,81,0.9);
            background:rgba(15,23,42,0.9);
            color:#f9fafb;
            font-size:11px;
            outline:none;
          "
        />
      </label>
    `;
  }

  function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const raw = (el.value || "").replace(",", ".").trim();
    if (raw === "") return null;
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }

  function initLogic() {
    const btnCalc = document.getElementById("dcf_calc");
    const btnClear = document.getElementById("dcf_clear");
    const resultBox = document.getElementById("dcf_result");

    if (!btnCalc || !btnClear || !resultBox) return;

    btnCalc.addEventListener("click", function () {
      const fcf0 = getNumber("dcf_fcf");
      const g1 = getNumber("dcf_g1");
      const g2 = getNumber("dcf_g2");
      const r = getNumber("dcf_r");
      const terminal = getNumber("dcf_terminal");
      const debt = getNumber("dcf_debt") || 0;
      const shares = getNumber("dcf_shares");
      const margin = getNumber("dcf_margin") || 0;
      const price = getNumber("dcf_price");
      const currencyInput = document.getElementById("dcf_currency");
      const currency = currencyInput && currencyInput.value ? currencyInput.value : "USD";

      if ([fcf0, g1, g2, r, terminal, shares].includes(null)) {
        alert("Vyplň prosím FCF, oba růsty, diskont, terminální násobek a počet akcií.");
        return;
      }

      const rDec = r / 100;
      const g1Dec = g1 / 100;
      const g2Dec = g2 / 100;
      const marginDec = margin / 100;

      if (rDec <= 0) {
        alert("Diskontní sazba musí být kladná.");
        return;
      }

      let fcf = fcf0;
      let pvSum = 0;
      let fcf10 = fcf0;

      for (let year = 1; year <= 10; year++) {
        if (year <= 5) {
          fcf = fcf * (1 + g1Dec);
        } else {
          fcf = fcf * (1 + g2Dec);
        }
        const discounted = fcf / Math.pow(1 + rDec, year);
        pvSum += discounted;
        if (year === 10) {
          fcf10 = fcf;
        }
      }

      const terminalValue = fcf10 * terminal;
      const pvTerminal = terminalValue / Math.pow(1 + rDec, 10);

      const equityValue = pvSum + pvTerminal + debt;

      let fairPerShare = equityValue / shares;
      const fairWithMargin = fairPerShare * (1 - marginDec);

      let diffText = "";
      if (price != null) {
        const diffPct = ((fairWithMargin - price) / price) * 100;
        if (isFinite(diffPct)) {
          diffText =
            diffPct >= 0
              ? `📈 Podhodnoceno přibližně o ${diffPct.toFixed(1)} %`
              : `⚠️ Předraženo přibližně o ${Math.abs(diffPct).toFixed(1)} %`;
        }
      }

      resultBox.style.display = "block";
      resultBox.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:4px;">
          <div>
            <div style="font-size:14px; font-weight:600;">
              ${fairWithMargin.toFixed(2)} ${currency}
            </div>
            <div style="font-size:11px; color:#9ca3af;">
              Férová cena na akcii po bezpečnostní marži (${margin.toFixed(0)} %).
            </div>
          </div>
          <div style="font-size:11px; color:#e5e7eb;">
            ${diffText}
          </div>
          <div style="font-size:10px; color:#9ca3af; margin-top:4px;">
            Výpočet: 10 let diskontovaných FCF (dvě růstové fáze) + terminální hodnota
            (P/FCF × FCF v 10. roce) + čistý dluh / hotovost, děleno počtem akcií.
          </div>
        </div>
      `;
    });

    btnClear.addEventListener("click", function () {
      const inputs = document.querySelectorAll("#main-panel-box input");
      inputs.forEach(function (el) {
        el.value = "";
      });
      resultBox.style.display = "none";
      resultBox.innerHTML = "";
    });
  }
})();

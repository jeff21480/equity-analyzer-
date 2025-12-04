// script.js – logika pro Analyzátor akcií
// ------------------------------------------------------
// Předpokládá následující ID v HTML:
//
// Hlavní panel – rychlý DCF:
//  tickerInput         (input pro ticker)
//  epsInput            (aktuální EPS)
//  growthInput         (očekávaný roční růst zisků %)
//  yearsInput          (počet let prognózy)
//  discountInput       (diskontní sazba %)
//  peInput             (cílové P/E na konci období)
//  marginInput         (bezpečnostní rezerva %)
//  fairValueResult     (element pro výstup textu)
//  calcFairValueBtn    (tlačítko „Spočítat férovou cenu“)
//  addToWatchlistMain  (tlačítko „Přidat tento ticker do watchlistu“)
//
// Watchlist:
//  watchlistTicker     (input v kartě Watchlist)
//  watchlistAddBtn     (tlačítko „Přidat“ ve watchlistu)
//  watchlistClearBtn   (tlačítko „Vymazat celý watchlist“)
//  watchlistList       (ul nebo div pro výpis položek)
//
// Kalkulačka složeného úročení:
//  ciStartInput        (počáteční částka)
//  ciMonthlyInput      (měsíční vklad)
//  ciRateInput         (průměrné roční zhodnocení %)
//  ciYearsInput        (počet let)
//  ciResult            (element s výsledkem – text)
//  ciCalcBtn           (tlačítko „Spočítat složené úročení“)
//
// Portfolio:
//  pfTickerInput       (ticker)
//  pfSharesInput       (počet kusů)
//  pfPriceInput        (nákupní cena za akcii)
//  pfAddBtn            (tlačítko „Přidat pozici“)
//  pfClearBtn          (tlačítko „Vymazat celé portfolio“)
//  pfList              (ul nebo div pro výpis portfolia)
//  pfSummary           (element se souhrnem portfolia)
//
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // --- Pomocné funkce ---
  const num = (el) => {
    const v = parseFloat(el.value.toString().replace(",", "."));
    return isNaN(v) ? 0 : v;
  };

  const formatCZK = (value) =>
    value.toLocaleString("cs-CZ", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const formatUSD = (value) =>
    "$ " +
    value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  // ------------------ RYCHLÝ DCF / FAIR VALUE ------------------

  const tickerInput = document.getElementById("tickerInput");
  const epsInput = document.getElementById("epsInput");
  const growthInput = document.getElementById("growthInput");
  const yearsInput = document.getElementById("yearsInput");
  const discountInput = document.getElementById("discountInput");
  const peInput = document.getElementById("peInput");
  const marginInput = document.getElementById("marginInput");
  const fairValueResult = document.getElementById("fairValueResult");
  const calcFairValueBtn = document.getElementById("calcFairValueBtn");
  const addToWatchlistMain = document.getElementById("addToWatchlistMain");

  function calculateFairValue() {
    const eps = num(epsInput);
    const g = num(growthInput) / 100;
    const n = num(yearsInput);
    const r = num(discountInput) / 100;
    const pe = num(peInput);
    const margin = num(marginInput) / 100;

    if (!eps || !n || !pe || !r) {
      fairValueResult.textContent =
        "Doplň prosím rozumné hodnoty (EPS, roky, diskont, P/E).";
      return null;
    }

    let currentEps = eps;
    let pv = 0;

    for (let year = 1; year <= n; year++) {
      currentEps *= 1 + g; // růst zisku
      const discounted = currentEps / Math.pow(1 + r, year);
      pv += discounted;
    }

    // terminální hodnota
    const terminalEps = currentEps;
    const terminalValue = terminalEps * pe;
    const discountedTV = terminalValue / Math.pow(1 + r, n);

    const intrinsic = pv + discountedTV;
    const buyPrice = intrinsic * (1 - margin);

    fairValueResult.innerHTML =
      `Odhad vnitřní (férové) ceny akcie je ` +
      `<strong>${formatUSD(intrinsic)}</strong>. ` +
      `S bezpečnostní rezervou ${(
        margin * 100
      ).toFixed()} % je orientační nákupní cena okolo ` +
      `<strong>${formatUSD(buyPrice)}</strong> na akcii.`;

    return {
      intrinsic,
      buyPrice,
    };
  }

  if (calcFairValueBtn) {
    calcFairValueBtn.addEventListener("click", () => {
      calculateFairValue();
    });
  }

  // ------------------ WATCHLIST ------------------

  const WATCHLIST_KEY = "aa_watchlist";

  const watchlistTicker = document.getElementById("watchlistTicker");
  const watchlistAddBtn = document.getElementById("watchlistAddBtn");
  const watchlistClearBtn = document.getElementById("watchlistClearBtn");
  const watchlistList = document.getElementById("watchlistList");

  function loadWatchlist() {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveWatchlist(list) {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  }

  function renderWatchlist() {
    if (!watchlistList) return;
    const list = loadWatchlist();
    watchlistList.innerHTML = "";

    if (!list.length) {
      const p = document.createElement("p");
      p.textContent = "Watchlist je prázdný.";
      watchlistList.appendChild(p);
      return;
    }

    list.forEach((item) => {
      const row = document.createElement("div");
      row.className = "watchlist-row";
      row.textContent = item.ticker;

      if (item.buyPrice) {
        row.textContent += ` – orientační nákupní cena ${formatUSD(
          item.buyPrice
        )}`;
      }
      watchlistList.appendChild(row);
    });
  }

  function addToWatchlist(ticker) {
    if (!ticker) return;
    const wl = loadWatchlist();
    const exists = wl.find(
      (x) => x.ticker.toUpperCase() === ticker.toUpperCase()
    );
    const calc = calculateFairValue(); // zkusit použít poslední výpočet

    if (exists) {
      // jen aktualizujeme případnou cenu
      if (calc) exists.buyPrice = calc.buyPrice;
    } else {
      wl.push({
        ticker: ticker.toUpperCase(),
        buyPrice: calc ? calc.buyPrice : null,
      });
    }

    saveWatchlist(wl);
    renderWatchlist();
  }

  if (addToWatchlistMain) {
    addToWatchlistMain.addEventListener("click", () => {
      if (!tickerInput) return;
      const ticker = tickerInput.value.trim();
      addToWatchlist(ticker);
    });
  }

  if (watchlistAddBtn) {
    watchlistAddBtn.addEventListener("click", () => {
      if (!watchlistTicker) return;
      const ticker = watchlistTicker.value.trim();
      addToWatchlist(ticker);
      watchlistTicker.value = "";
    });
  }

  if (watchlistClearBtn) {
    watchlistClearBtn.addEventListener("click", () => {
      if (!confirm("Opravdu chceš smazat celý watchlist?")) return;
      saveWatchlist([]);
      renderWatchlist();
    });
  }

  renderWatchlist();

  // ------------------ KALKULAČKA SLOŽENÉHO ÚROČENÍ ------------------

  const ciStartInput = document.getElementById("ciStartInput");
  const ciMonthlyInput = document.getElementById("ciMonthlyInput");
  const ciRateInput = document.getElementById("ciRateInput");
  const ciYearsInput = document.getElementById("ciYearsInput");
  const ciResult = document.getElementById("ciResult");
  const ciCalcBtn = document.getElementById("ciCalcBtn");

  function calculateCompound() {
    const start = num(ciStartInput);
    const monthly = num(ciMonthlyInput);
    const rate = num(ciRateInput) / 100;
    const years = num(ciYearsInput);

    if (!years || (!start && !monthly)) {
      if (ciResult)
        ciResult.textContent =
          "Doplň prosím počáteční částku nebo měsíční vklad a počet let.";
      return;
    }

    let value = start;
    const yearlyContribution = monthly * 12;

    for (let i = 0; i < years; i++) {
      value = (value + yearlyContribution) * (1 + rate);
    }

    if (ciResult) {
      ciResult.innerHTML =
        `Za ${years} let může mít tvoje investice přibližně ` +
        `<strong>${formatCZK(value)} Kč</strong>. ` +
        `Je to hrubý odhad bez zohlednění daní a inflace.`;
    }
  }

  if (ciCalcBtn) {
    ciCalcBtn.addEventListener("click", calculateCompound);
  }

  // ------------------ PORTFOLIO ------------------

  const PORTFOLIO_KEY = "aa_portfolio";

  const pfTickerInput = document.getElementById("pfTickerInput");
  const pfSharesInput = document.getElementById("pfSharesInput");
  const pfPriceInput = document.getElementById("pfPriceInput");
  const pfAddBtn = document.getElementById("pfAddBtn");
  const pfClearBtn = document.getElementById("pfClearBtn");
  const pfList = document.getElementById("pfList");
  const pfSummary = document.getElementById("pfSummary");

  function loadPortfolio() {
    try {
      const raw = localStorage.getItem(PORTFOLIO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function savePortfolio(list) {
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(list));
  }

  function renderPortfolio() {
    if (!pfList) return;
    const list = loadPortfolio();
    pfList.innerHTML = "";

    if (!list.length) {
      const p = document.createElement("p");
      p.textContent = "Portfolio je zatím prázdné.";
      pfList.appendChild(p);
      if (pfSummary) pfSummary.textContent = "";
      return;
    }

    let totalCost = 0;

    list.forEach((pos, index) => {
      const row = document.createElement("div");
      row.className = "portfolio-row";

      const positionValue = pos.shares * pos.price;
      totalCost += positionValue;

      row.textContent = `${pos.ticker} – ${pos.shares} ks, nákupka ${formatUSD(
        pos.price
      )} (celkem ${formatUSD(positionValue)})`;

      // jednoduché tlačítko na smazání jedné pozice
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "×";
      removeBtn.className = "portfolio-remove";
      removeBtn.addEventListener("click", () => {
        const list = loadPortfolio();
        list.splice(index, 1);
        savePortfolio(list);
        renderPortfolio();
      });

      row.appendChild(removeBtn);
      pfList.appendChild(row);
    });

    if (pfSummary) {
      pfSummary.textContent = `Celková nákupní hodnota portfolia: ${formatUSD(
        totalCost
      )}`;
    }
  }

  if (pfAddBtn) {
    pfAddBtn.addEventListener("click", () => {
      const ticker = pfTickerInput.value.trim().toUpperCase();
      const shares = num(pfSharesInput);
      const price = num(pfPriceInput);

      if (!ticker || !shares || !price) return;

      const list = loadPortfolio();
      list.push({ ticker, shares, price });
      savePortfolio(list);
      renderPortfolio();

      pfTickerInput.value = "";
      pfSharesInput.value = "";
      pfPriceInput.value = "";
    });
  }

  if (pfClearBtn) {
    pfClearBtn.addEventListener("click", () => {
      if (!confirm("Opravdu chceš smazat celé portfolio?")) return;
      savePortfolio([]);
      renderPortfolio();
    });
  }

  renderPortfolio();
});

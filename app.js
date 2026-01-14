(() => {
  "use strict";

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);

  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => (t.style.display = "none"), 2400);
  }

  // robust number parse: accepts "1 234,56" | "1,234.56" | "1234.56" | "1234,56"
  function num(v) {
    if (v == null) return NaN;
    let s = String(v).trim();
    if (!s) return NaN;

    // remove spaces
    s = s.replace(/\s+/g, "");

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    if (hasComma && hasDot) {
      // assume comma thousands, dot decimal -> remove commas
      s = s.replace(/,/g, "");
    } else if (hasComma && !hasDot) {
      // assume comma decimal
      s = s.replace(/,/g, ".");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function unitsMultiplier(units) {
    if (units === "m") return 1e6;
    if (units === "b") return 1e9;
    return 1;
  }

  function fmtMoney(v, currency) {
    if (!Number.isFinite(v)) return "—";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 2,
      }).format(v);
    } catch {
      return `${v.toFixed(2)} ${currency || ""}`.trim();
    }
  }

  function fmtPct(v) {
    if (!Number.isFinite(v)) return "—";
    return `${v.toFixed(1)}%`;
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  // =========================
  // State + storage
  // =========================
  const LS_LANG = "ea_lang_v1";
  const LS_WL = "ea_watchlist_v1";

  const state = {
    lang: (localStorage.getItem(LS_LANG) || "en").toLowerCase(),
    view: "model",
  };

  function loadWL() {
    try {
      const raw = localStorage.getItem(LS_WL);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWL(arr) {
    localStorage.setItem(LS_WL, JSON.stringify(arr));
  }

  // =========================
  // i18n
  // =========================
  const i18n = {
    en: {
      heroSub: "DCF fair value • Watchlist • Education",
      tabs: { model: "DCF Model", watch: "Watchlist", about: "About" },

      inputs: "Inputs",
      inputsHint:
        "Multi-scenario DCF with guardrails. Use ranges (Bear/Base/Bull) and stay conservative.",
      outputs: "Outputs",
      outputsHint: "Fair value range + sanity checks.",
      ready: "READY",
      modeQuick: "MODE: Quick",
      modeAdvanced: "MODE: Advanced",

      basics: "Basics",
      ticker: "Ticker / Name",
      tickerSub: "Used for watchlist label.",
      currency: "Currency",
      currencySub: "All inputs should be in the selected currency.",
      type: "Company type",
      typeSub: "Sets reasonable defaults + warnings (you can override).",
      mode: "Mode",
      modeSub: "Quick: enter Base; Bear/Bull are derived (± spread).",
      price: "Current price (optional)",
      priceSub: "Used only for upside / margin-of-safety view.",
      mos: "Margin of Safety",
      mosSub: "Applied after valuation (to Base) for a conservative target.",

      dcfMethod: "DCF method",
      method: "Method",
      methodSub: "If you don’t know FCF, estimate it via revenue × margin.",
      years: "Projection (years)",
      yearsSub: "Commonly 5–10 years depending on predictability.",
      fcf: "FCF (TTM or 3–5y avg)",
      fcfSub: "Prefer a 3–5 year average for cyclical firms (avoid one great year).",
      units: "Units",
      unitsSub: "Optional: enter values in millions/billions for comfort.",

      capital: "Capital structure",
      shares: "Shares (diluted)",
      sharesSub: "Used to compute fair value per share.",
      cash: "Cash (optional)",
      cashSub: "Added to enterprise value (EV → Equity).",
      debt: "Debt (optional)",
      debtSub: "Subtracted to get equity value.",

      assumptions: "Assumptions (3 scenarios)",
      disc: "Discount rate (base) %",
      discSub: "Higher risk → higher discount → lower fair value.",
      term: "Terminal growth %",
      termSub: "Long-run growth after projection. Keep conservative.",
      baseGrowth: "Base FCF growth %",
      baseGrowthSub: "Annual growth during projection.",
      spread: "Quick spread (± pp)",
      spreadSub: "Quick mode derives Bear/Base/Bull = Base ± spread.",

      btnCalc: "Calculate",
      btnReset: "Reset",
      btnSave: "Save result",
      btnSaveTop: "Save to Watchlist",
      btnDemo: "Demo values",
      btnBack: "Back",
      export: "Export CSV",
      clear: "Clear",
      tipQuick: "Tip: In Quick mode you set only Base; Bear/Bull are derived automatically.",

      outBase: "Fair value (Base)",
      outBaseNote: "Bear/Bull below.",
      outRange: "Range (Bear → Bull)",
      outRangeNote: "Use range, not a single number.",
      outUpside: "Upside vs price",
      outUpsideNote: "Needs current price (optional).",
      outWarn: "Warnings / checks",
      outWarnNote: "—",
      details: "Details",

      wlTitle: "Watchlist",
      wlHint: "Saved calculations stored locally in your browser (localStorage).",
      wlNote:
        "Note: Watchlist is stored locally in your browser (localStorage). Different device = different watchlist.",
      wlTh: ["Name", "Base", "Range", "Price", "Upside", "Actions"],
      wlEmpty: "No saved items yet.",
      wlLoad: "Load",
      wlDelete: "Delete",

      aboutTitle: "About Equity Analyzer",
      aboutHint: "Educational valuation tool based on a multi-scenario DCF model.",
      edu: "EDUCATIONAL",
      abWhat: "What this tool does",
      abBest: "Best suited for",
      abLess: "Less suitable for",
      abNotice: "Important notice",
      abNoticeText:
        "This application is NOT financial advice. It is for educational and analytical purposes only. All outputs depend entirely on user assumptions.",

      toasts: {
        saved: "Saved to Watchlist.",
        updated: "Updated Watchlist item.",
        cleared: "Watchlist cleared.",
        exported: "CSV exported.",
        loaded: "Loaded from Watchlist.",
        reset: "Reset.",
        demo: "Demo loaded.",
        langEN: "Language: English",
        langCZ: "Jazyk: čeština",
        needInputs: "Please fill at least FCF + shares.",
        badTerminal: "Terminal growth must be lower than discount rate.",
      },

      warns: {
        ok: "OK",
        missingPrice: "Price not set (upside hidden).",
        negativeFCF: "FCF is negative/unstable → DCF may be unreliable.",
        highTerm: "Terminal growth seems high; keep conservative.",
        highGrowth: "Growth seems high; consider lowering Base.",
        lowDisc: "Discount rate seems low for this risk level.",
      },
    },

    cz: {
      heroSub: "DCF férová hodnota • Watchlist • Vysvětlení",
      tabs: { model: "DCF Model", watch: "Watchlist", about: "O aplikaci" },

      inputs: "Vstupy",
      inputsHint:
        "DCF ve 3 scénářích s guardrails. Používej rozpětí (Bear/Base/Bull) a buď konzervativní.",
      outputs: "Výstupy",
      outputsHint: "Rozpětí férové hodnoty + kontrolní upozornění.",
      ready: "PŘIPRAVENO",
      modeQuick: "REŽIM: Quick",
      modeAdvanced: "REŽIM: Advanced",

      basics: "Základ",
      ticker: "Ticker / Název",
      tickerSub: "Použije se jako název ve Watchlistu.",
      currency: "Měna",
      currencySub: "Všechny vstupy drž v zvolené měně.",
      type: "Typ firmy",
      typeSub: "Nastaví rozumné defaulty + upozornění (můžeš upravit).",
      mode: "Režim",
      modeSub: "Quick: zadáš Base; Bear/Bull se dopočítají (± spread).",
      price: "Aktuální cena (volitelné)",
      priceSub: "Pouze pro výpočet upside / margin-of-safety.",
      mos: "Margin of Safety",
      mosSub: "Aplikuje se po výpočtu (na Base) pro konzervativní cíl.",

      dcfMethod: "DCF metoda",
      method: "Metoda",
      methodSub: "Když neznáš FCF, odhadni přes tržby × marži.",
      years: "Projekce (roky)",
      yearsSub: "Typicky 5–10 let podle predikovatelnosti.",
      fcf: "FCF (TTM nebo průměr 3–5 let)",
      fcfSub: "U cyklických firem raději průměr 3–5 let (ne jeden skvělý rok).",
      units: "Jednotky",
      unitsSub: "Volitelně zadávej v milionech/miliardách pro pohodlí.",

      capital: "Kapitálová struktura",
      shares: "Počet akcií (diluted)",
      sharesSub: "Použije se pro férovou cenu na akcii.",
      cash: "Hotovost (volitelné)",
      cashSub: "Přičte se (EV → Equity).",
      debt: "Dluh (volitelné)",
      debtSub: "Odečte se pro equity value.",

      assumptions: "Předpoklady (3 scénáře)",
      disc: "Diskontní sazba (base) %",
      discSub: "Vyšší riziko → vyšší diskont → nižší férová hodnota.",
      term: "Terminální růst %",
      termSub: "Dlouhodobý růst po projekci. Konzervativně.",
      baseGrowth: "Růst FCF (Base) %",
      baseGrowthSub: "Roční růst v projekci.",
      spread: "Quick spread (± p. b.)",
      spreadSub: "Quick dopočítá Bear/Base/Bull = Base ± spread.",

      btnCalc: "Spočítat",
      btnReset: "Reset",
      btnSave: "Uložit výsledek",
      btnSaveTop: "Uložit do Watchlistu",
      btnDemo: "Demo hodnoty",
      btnBack: "Zpět",
      export: "Export CSV",
      clear: "Smazat vše",
      tipQuick: "Tip: V Quick režimu nastavuješ jen Base; Bear/Bull se dopočítají automaticky.",

      outBase: "Férová hodnota (Base)",
      outBaseNote: "Bear/Bull níže.",
      outRange: "Rozpětí (Bear → Bull)",
      outRangeNote: "Používej rozpětí, ne jedno číslo.",
      outUpside: "Upside vs cena",
      outUpsideNote: "Potřebuje aktuální cenu (volitelné).",
      outWarn: "Upozornění / kontrola",
      outWarnNote: "—",
      details: "Detaily",

      wlTitle: "Watchlist",
      wlHint: "Uložené výpočty jsou v prohlížeči (localStorage).",
      wlNote:
        "Pozn.: Watchlist je uložen lokálně v prohlížeči (localStorage). Jiný telefon/PC = jiný watchlist.",
      wlTh: ["Název", "Base", "Rozpětí", "Cena", "Upside", "Akce"],
      wlEmpty: "Zatím nic uloženého.",
      wlLoad: "Načíst",
      wlDelete: "Smazat",

      aboutTitle: "O aplikaci Equity Analyzer",
      aboutHint: "Vzdělávací valuace postavená na multi-scenario DCF modelu.",
      edu: "VZDĚLÁVACÍ",
      abWhat: "Co to dělá",
      abBest: "Hodí se pro",
      abLess: "Méně vhodné pro",
      abNotice: "Důležité upozornění",
      abNoticeText:
        "Tato aplikace NENÍ finanční poradenství. Slouží pouze pro vzdělávací a analytické účely. Výstupy závisí čistě na tvých předpokladech.",

      toasts: {
        saved: "Uloženo do Watchlistu.",
        updated: "Položka ve Watchlistu aktualizována.",
        cleared: "Watchlist smazán.",
        exported: "CSV export hotový.",
        loaded: "Načteno z Watchlistu.",
        reset: "Reset hotový.",
        demo: "Demo načteno.",
        langEN: "Language: English",
        langCZ: "Jazyk: čeština",
        needInputs: "Vyplň aspoň FCF + počet akcií.",
        badTerminal: "Terminální růst musí být menší než diskont.",
      },

      warns: {
        ok: "OK",
        missingPrice: "Není cena (upside se nepočítá).",
        negativeFCF: "FCF je záporné/nestabilní → DCF může být nespolehlivé.",
        highTerm: "Terminální růst je dost vysoký; drž konzervativně.",
        highGrowth: "Růst vypadá vysoký; zvaž nižší Base.",
        lowDisc: "Diskontní sazba je možná nízká vzhledem k riziku.",
      },
    },
  };

  function t() {
    return i18n[state.lang] || i18n.en;
  }

  function setLang(lang) {
    state.lang = (lang || "en").toLowerCase() === "cz" ? "cz" : "en";
    localStorage.setItem(LS_LANG, state.lang);

    // top bar
    $("heroSub").textContent = t().heroSub;

    // tabs
    $("tabModel").textContent = t().tabs.model;
    $("tabWatch").textContent = t().tabs.watch;
    $("tabAbout").textContent = t().tabs.about;

    // model
    $("hInputs").textContent = t().inputs;
    $("hInputsHint").textContent = t().inputsHint;
    $("hOutputs").textContent = t().outputs;
    $("hOutputsHint").textContent = t().outputsHint;
    $("statusBadge").textContent = t().ready;

    $("secBasics").textContent = t().basics;
    $("lbTicker").textContent = t().ticker;
    $("sbTicker").textContent = t().tickerSub;
    $("lbCurrency").textContent = t().currency;
    $("sbCurrency").textContent = t().currencySub;
    $("lbType").textContent = t().type;
    $("sbType").textContent = t().typeSub;
    $("lbMode").textContent = t().mode;
    $("sbMode").textContent = t().modeSub;
    $("lbPrice").textContent = t().price;
    $("sbPrice").textContent = t().priceSub;
    $("lbMos").textContent = t().mos;
    $("sbMos").textContent = t().mosSub;

    $("secDCF").textContent = t().dcfMethod;
    $("lbMethod").textContent = t().method;
    $("sbMethod").textContent = t().methodSub;
    $("lbYears").textContent = t().years;
    $("sbYears").textContent = t().yearsSub;
    $("lbFCF").textContent = t().fcf;
    $("sbFCF").textContent = t().fcfSub;
    $("lbUnits").textContent = t().units;
    $("sbUnits").textContent = t().unitsSub;

    $("secCapital").textContent = t().capital;
    $("lbShares").textContent = t().shares;
    $("sbShares").textContent = t().sharesSub;
    $("lbCash").textContent = t().cash;
    $("sbCash").textContent = t().cashSub;
    $("lbDebt").textContent = t().debt;
    $("sbDebt").textContent = t().debtSub;

    $("secAssumptions").textContent = t().assumptions;
    $("lbDisc").textContent = t().disc;
    $("sbDisc").textContent = t().discSub;
    $("lbTerm").textContent = t().term;
    $("sbTerm").textContent = t().termSub;
    $("lbBase").textContent = t().baseGrowth;
    $("sbBase").textContent = t().baseGrowthSub;
    $("lbSpread").textContent = t().spread;
    $("sbSpread").textContent = t().spreadSub;

    $("btnCalc").textContent = t().btnCalc;
    $("btnReset").textContent = t().btnReset;
    $("btnSave").textContent = t().btnSave;
    $("btnSaveTop").textContent = t().btnSaveTop;
    $("btnDemo").textContent = t().btnDemo;
    $("btnBackFromWL").textContent = t().btnBack;
    $("btnBackFromAbout").textContent = t().btnBack;
    $("btnExport").textContent = t().export;
    $("btnClearWL").textContent = t().clear;
    $("tipQuick").textContent = t().tipQuick;

    // outputs
    $("outHBase").textContent = t().outBase;
    $("outBaseNote").textContent = t().outBaseNote;
    $("outHRange").textContent = t().outRange;
    $("outRangeNote").textContent = t().outRangeNote;
    $("outHUpside").textContent = t().outUpside;
    $("outUpsideNote").textContent = t().outUpsideNote;
    $("outHWarn").textContent = t().outWarn;
    $("outWarnNote").textContent = t().outWarnNote;
    $("secDetails").textContent = t().details;

    // watchlist
    $("hWatch").textContent = t().wlTitle;
    $("hWatchHint").textContent = t().wlHint;
    $("wlNote").textContent = t().wlNote;
    const th = t().wlTh;
    $("wlTh1").textContent = th[0];
    $("wlTh2").textContent = th[1];
    $("wlTh3").textContent = th[2];
    $("wlTh4").textContent = th[3];
    $("wlTh5").textContent = th[4];
    $("wlTh6").textContent = th[5];
    $("wlEmpty").textContent = t().wlEmpty;

    // about
    $("hAbout").textContent = t().aboutTitle;
    $("hAboutHint").textContent = t().aboutHint;
    $("badgeEdu").textContent = t().edu;
    $("abWhat").textContent = t().abWhat;
    $("abBest").textContent = t().abBest;
    $("abLess").textContent = t().abLess;
    $("abNotice").textContent = t().abNotice;
    $("abNoticeText").textContent = t().abNoticeText;

    // lang buttons style
    $("btnLangEN").classList.toggle("active", state.lang === "en");
    $("btnLangCZ").classList.toggle("active", state.lang === "cz");

    toast(state.lang === "cz" ? t().toasts.langCZ : t().toasts.langEN);
  }

  // =========================
  // Views (tabs)
  // =========================
  function showView(view) {
    state.view = view;

    $("viewModel").classList.toggle("hidden", view !== "model");
    $("viewWatch").classList.toggle("hidden", view !== "watch");
    $("viewAbout").classList.toggle("hidden", view !== "about");

    $("tabModel").classList.toggle("active", view === "model");
    $("tabWatch").classList.toggle("active", view === "watch");
    $("tabAbout").classList.toggle("active", view === "about");
  }

  // =========================
  // Info toggles
  // =========================
  function wireInfoToggles() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".infoBtn");
      if (!btn) return;
      const id = btn.getAttribute("data-info");
      if (!id) return;
      const el = $(id);
      if (!el) return;
      el.classList.toggle("open");
    });
  }

  // =========================
  // Defaults by company type
  // =========================
  function applyTypeDefaults() {
    const type = ($("in_type")?.value || "growth").toLowerCase();

    // If user already changed stuff, we still set reasonable defaults,
    // but not too aggressive: only if empty OR clearly not a number.
    const setIfBad = (id, val) => {
      const el = $(id);
      if (!el) return;
      const cur = num(el.value);
      if (!Number.isFinite(cur)) el.value = String(val);
    };

    // base defaults
    if (type === "growth") {
      setIfBad("in_disc", 9);
      setIfBad("in_term", 2.5);
      setIfBad("in_base", 12);
      setIfBad("in_spread", 2);
    } else if (type === "mature") {
      setIfBad("in_disc", 8.5);
      setIfBad("in_term", 2.0);
      setIfBad("in_base", 6);
      setIfBad("in_spread", 1.5);
    } else if (type === "cyclical") {
      setIfBad("in_disc", 10);
      setIfBad("in_term", 1.8);
      setIfBad("in_base", 4);
      setIfBad("in_spread", 2.5);
    } else if (type === "financial") {
      setIfBad("in_disc", 10);
      setIfBad("in_term", 2.0);
      setIfBad("in_base", 4);
      setIfBad("in_spread", 2);
    }

    // update badge
    const mode = ($("in_mode")?.value || "quick").toLowerCase();
    $("modeBadge").textContent = mode === "advanced" ? t().modeAdvanced : t().modeQuick;
  }

  // =========================
  // DCF compute
  // =========================
  function computeScenario({ fcf0, years, r, g, gT }) {
    // fcf0 is current/starting FCF, growth g for years, terminal growth gT
    let pvSum = 0;
    let fcf = fcf0;
    const details = [];

    for (let i = 1; i <= years; i++) {
      fcf = fcf * (1 + g);
      const pv = fcf / Math.pow(1 + r, i);
      pvSum += pv;
      if (i <= 3 || i === years) {
        details.push({ year: i, fcf, pv });
      }
    }

    // terminal at year N based on fcf_N (already grown to year N)
    const tv = (fcf * (1 + gT)) / (r - gT);
    const pvTV = tv / Math.pow(1 + r, years);

    return { pvCF: pvSum, tv, pvTV, lastFCF: fcf, details };
  }

  function calcAll() {
    const currency = $("in_currency")?.value || "USD";
    const units = $("in_units")?.value || "raw";
    const mult = unitsMultiplier(units);

    const years = num($("in_years")?.value);
    const fcf0 = num($("in_fcf")?.value) * mult;
    const shares = num($("in_shares")?.value);

    const cash = (num($("in_cash")?.value) || 0) * mult;
    const debt = (num($("in_debt")?.value) || 0) * mult;

    const r = num($("in_disc")?.value) / 100;
    const gT = num($("in_term")?.value) / 100;

    const gBase = num($("in_base")?.value) / 100;
    const spread = num($("in_spread")?.value) / 100;

    const mos = num($("in_mos")?.value) / 100;

    const price = num($("in_price")?.value);

    if (!Number.isFinite(fcf0) || !Number.isFinite(shares) || shares <= 0) {
      toast(t().toasts.needInputs);
      $("out_warn").textContent = "—";
      $("outWarnNote").textContent = t().toasts.needInputs;
      return;
    }

    if (!(r > gT)) {
      toast(t().toasts.badTerminal);
      $("out_warn").textContent = "—";
      $("outWarnNote").textContent = t().toasts.badTerminal;
      return;
    }

    const gBear = gBase - spread;
    const gBull = gBase + spread;

    // compute scenarios
    const S = {
      bear: computeScenario({ fcf0, years, r, g: gBear, gT }),
      base: computeScenario({ fcf0, years, r, g: gBase, gT }),
      bull: computeScenario({ fcf0, years, r, g: gBull, gT }),
    };

    function toPerShare(scn) {
      const ev = scn.pvCF + scn.pvTV;
      const equity = ev + cash - debt;
      return equity / shares;
    }

    const perBear = toPerShare(S.bear);
    const perBase = toPerShare(S.base);
    const perBull = toPerShare(S.bull);

    const baseAfterMos = perBase * (1 - mos);

    // output
    $("out_base").textContent = fmtMoney(baseAfterMos, currency);
    $("out_range").textContent =
      `${fmtMoney(perBear * (1 - mos), currency)} → ${fmtMoney(perBull * (1 - mos), currency)}`;

    // upside
    if (Number.isFinite(price) && price > 0) {
      const up = (baseAfterMos - price) / price;
      $("out_upside").textContent = fmtPct(up * 100);
      $("outUpsideNote").textContent = `${fmtMoney(price, currency)} → ${fmtMoney(baseAfterMos, currency)}`;
    } else {
      $("out_upside").textContent = "—";
      $("outUpsideNote").textContent = t().warns.missingPrice;
    }

    // warnings
    const warnList = [];
    if (fcf0 < 0) warnList.push(t().warns.negativeFCF);
    if (gT > 0.03) warnList.push(t().warns.highTerm);
    if (gBase > 0.18) warnList.push(t().warns.highGrowth);

    // simple risk sanity by type
    const type = ($("in_type")?.value || "growth").toLowerCase();
    if ((type === "growth" || type === "cyclical") && r < 0.085) warnList.push(t().warns.lowDisc);
    if (type === "financial" && gBase > 0.10) warnList.push(t().warns.highGrowth);

    $("out_warn").textContent = warnList.length ? "⚠" : "✓";
    $("outWarnNote").textContent = warnList.length ? warnList.join(" • ") : t().warns.ok;

    // details
    const det = [];
    det.push(`Discount rate (r): ${fmtPct(r * 100)}`);
    det.push(`Terminal growth (gT): ${fmtPct(gT * 100)}`);
    det.push(
      `Growth (Bear/Base/Bull): ${fmtPct(gBear * 100)} / ${fmtPct(gBase * 100)} / ${fmtPct(gBull * 100)}`
    );
    det.push(`MoS: ${fmtPct(mos * 100)}`);
    det.push(`FCF0: ${fmtMoney(fcf0, currency)} • Years: ${years}`);
    det.push(`Cash: ${fmtMoney(cash, currency)} • Debt: ${fmtMoney(debt, currency)} • Shares: ${shares.toLocaleString()}`);
    det.push(
      `Per share (pre-MoS): Bear ${fmtMoney(perBear, currency)} • Base ${fmtMoney(perBase, currency)} • Bull ${fmtMoney(perBull, currency)}`
    );
    $("out_details").textContent = det.join("\n");

    $("statusBadge").textContent = "OK";
    toast("Calculated");
  }

  // =========================
  // Watchlist
  // =========================
  function buildItemFromInputs() {
    const currency = $("in_currency")?.value || "USD";
    const units = $("in_units")?.value || "raw";
    const mult = unitsMultiplier(units);

    const ticker = ($("in_ticker")?.value || "").trim() || "(unnamed)";
    const type = ($("in_type")?.value || "growth");
    const mode = ($("in_mode")?.value || "quick");
    const method = ($("in_method")?.value || "fcf");

    const years = num($("in_years")?.value);
    const fcf = num($("in_fcf")?.value) * mult;
    const shares = num($("in_shares")?.value);
    const cash = (num($("in_cash")?.value) || 0) * mult;
    const debt = (num($("in_debt")?.value) || 0) * mult;

    const r = num($("in_disc")?.value);
    const gT = num($("in_term")?.value);
    const base = num($("in_base")?.value);
    const spread = num($("in_spread")?.value);

    const mos = num($("in_mos")?.value);
    const price = num($("in_price")?.value);

    return {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      date: todayISO(),
      ticker,
      currency,
      type,
      mode,
      method,
      years,
      fcf,
      shares,
      cash,
      debt,
      r,
      gT,
      base,
      spread,
      mos,
      price: Number.isFinite(price) ? price : null,
      // store last outputs too (filled after calc)
      out: {
        base: $("out_base")?.textContent || "—",
        range: $("out_range")?.textContent || "—",
        upside: $("out_upside")?.textContent || "—",
      },
    };
  }

  function renderWL() {
    const body = $("wlBody");
    if (!body) return;

    const wl = loadWL();

    body.innerHTML = "";
    if (!wl.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "mini";
      td.id = "wlEmpty";
      td.textContent = t().wlEmpty;
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    wl.forEach((it) => {
      const tr = document.createElement("tr");

      const td1 = document.createElement("td");
      td1.innerHTML = `<b style="color:rgba(243,239,255,.92)">${escapeHtml(it.ticker)}</b><div class="mini">${escapeHtml(it.date || "")}</div>`;
      tr.appendChild(td1);

      const td2 = document.createElement("td");
      td2.textContent = it.out?.base || "—";
      tr.appendChild(td2);

      const td3 = document.createElement("td");
      td3.textContent = it.out?.range || "—";
      tr.appendChild(td3);

      const td4 = document.createElement("td");
      td4.textContent = it.price != null ? fmtMoney(it.price, it.currency) : "—";
      tr.appendChild(td4);

      const td5 = document.createElement("td");
      td5.textContent = it.out?.upside || "—";
      tr.appendChild(td5);

      const td6 = document.createElement("td");
      td6.style.whiteSpace = "nowrap";

      const bLoad = document.createElement("button");
      bLoad.className = "btn smallBtn";
      bLoad.textContent = t().wlLoad;
      bLoad.addEventListener("click", () => {
        loadItemToInputs(it);
        toast(t().toasts.loaded);
        showView("model");
      });

      const bDel = document.createElement("button");
      bDel.className = "btn smallBtn";
      bDel.style.marginLeft = "8px";
      bDel.textContent = t().wlDelete;
      bDel.addEventListener("click", () => {
        const next = loadWL().filter((x) => x.id !== it.id);
        saveWL(next);
        renderWL();
      });

      td6.appendChild(bLoad);
      td6.appendChild(bDel);
      tr.appendChild(td6);

      body.appendChild(tr);
    });
  }

  function loadItemToInputs(it) {
    $("in_ticker").value = it.ticker || "";
    $("in_currency").value = it.currency || "USD";
    $("in_type").value = it.type || "growth";
    $("in_mode").value = it.mode || "quick";
    $("in_method").value = it.method || "fcf";
    $("in_years").value = it.years != null ? String(it.years) : "10";

    // values stored as raw absolute numbers; set units to raw for safety
    $("in_units").value = "raw";
    $("in_fcf").value = it.fcf != null ? String(it.fcf) : "";
    $("in_shares").value = it.shares != null ? String(it.shares) : "";
    $("in_cash").value = it.cash != null ? String(it.cash) : "";
    $("in_debt").value = it.debt != null ? String(it.debt) : "";

    $("in_disc").value = it.r != null ? String(it.r) : "9";
    $("in_term").value = it.gT != null ? String(it.gT) : "2.5";
    $("in_base").value = it.base != null ? String(it.base) : "12";
    $("in_spread").value = it.spread != null ? String(it.spread) : "2";
    $("in_mos").value = it.mos != null ? String(it.mos) : "0";
    $("in_price").value = it.price != null ? String(it.price) : "";

    applyTypeDefaults(); // updates badge
  }

  function saveCurrentToWL() {
    // ensure calc done (or do it)
    calcAll();

    const item = buildItemFromInputs();
    const wl = loadWL();

    // If same ticker exists, update the newest
    const idx = wl.findIndex((x) => (x.ticker || "").toLowerCase() === item.ticker.toLowerCase());
    if (idx >= 0) {
      wl[idx] = { ...wl[idx], ...item, id: wl[idx].id }; // keep old id
      saveWL(wl);
      renderWL();
      toast(t().toasts.updated);
    } else {
      wl.unshift(item);
      saveWL(wl);
      renderWL();
      toast(t().toasts.saved);
    }
  }

  function clearWL() {
    saveWL([]);
    renderWL();
    toast(t().toasts.cleared);
  }

  function exportCSV() {
    const wl = loadWL();
    if (!wl.length) return;

    const header = [
      "date",
      "ticker",
      "currency",
      "type",
      "years",
      "fcf",
      "shares",
      "cash",
      "debt",
      "disc%",
      "term%",
      "baseGrowth%",
      "spread%",
      "mos%",
      "price",
      "out_base",
      "out_range",
      "out_upside",
    ];

    const rows = wl.map((it) => [
      it.date || "",
      it.ticker || "",
      it.currency || "",
      it.type || "",
      it.years ?? "",
      it.fcf ?? "",
      it.shares ?? "",
      it.cash ?? "",
      it.debt ?? "",
      it.r ?? "",
      it.gT ?? "",
      it.base ?? "",
      it.spread ?? "",
      it.mos ?? "",
      it.price ?? "",
      it.out?.base || "",
      it.out?.range || "",
      it.out?.upside || "",
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `equity-analyzer-watchlist_${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
    toast(t().toasts.exported);
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // =========================
  // Demo + Reset
  // =========================
  function demo() {
    $("in_ticker").value = "AAPL";
    $("in_currency").value = "USD";
    $("in_type").value = "mature";
    $("in_mode").value = "quick";
    $("in_method").value = "fcf";
    $("in_years").value = "10";
    $("in_units").value = "b";

    $("in_fcf").value = "110"; // billions (because Units=Billions)
    $("in_shares").value = "15500000000";
    $("in_cash").value = "65";
    $("in_debt").value = "105";

    $("in_disc").value = "8.5";
    $("in_term").value = "2.0";
    $("in_base").value = "6";
    $("in_spread").value = "1.5";

    $("in_price").value = "180.50";
    $("in_mos").value = "15";

    applyTypeDefaults();
    toast(t().toasts.demo);
  }

  function resetAll() {
    // keep language
    $("in_ticker").value = "";
    $("in_currency").value = "USD";
    $("in_type").value = "growth";
    $("in_mode").value = "quick";
    $("in_method").value = "fcf";
    $("in_years").value = "10";
    $("in_units").value = "raw";

    $("in_fcf").value = "";
    $("in_shares").value = "";
    $("in_cash").value = "";
    $("in_debt").value = "";

    $("in_disc").value = "9";
    $("in_term").value = "2.5";
    $("in_base").value = "12";
    $("in_spread").value = "2";
    $("in_price").value = "";
    $("in_mos").value = "0";

    $("out_base").textContent = "—";
    $("out_range").textContent = "—";
    $("out_upside").textContent = "—";
    $("out_warn").textContent = "—";
    $("outWarnNote").textContent = t().outWarnNote;
    $("out_details").textContent = "—";
    $("statusBadge").textContent = t().ready;

    applyTypeDefaults();
    toast(t().toasts.reset);
  }

  // =========================
  // Wiring
  // =========================
  function wireTabs() {
    document.querySelectorAll(".tab").forEach((b) => {
      b.addEventListener("click", () => {
        const v = b.getAttribute("data-view");
        if (v === "model") showView("model");
        if (v === "watch") {
          renderWL();
          showView("watch");
        }
        if (v === "about") showView("about");
      });
    });

    $("btnBackFromWL").addEventListener("click", () => showView("model"));
    $("btnBackFromAbout").addEventListener("click", () => showView("model"));
  }

  function wireLang() {
    $("btnLangEN").addEventListener("click", () => setLang("en"));
    $("btnLangCZ").addEventListener("click", () => setLang("cz"));
  }

  function wireButtons() {
    $("btnCalc").addEventListener("click", calcAll);
    $("btnReset").addEventListener("click", resetAll);

    $("btnDemo").addEventListener("click", demo);

    $("btnSave").addEventListener("click", () => {
      saveCurrentToWL();
      renderWL();
    });
    $("btnSaveTop").addEventListener("click", () => {
      saveCurrentToWL();
      renderWL();
    });

    $("btnClearWL").addEventListener("click", clearWL);
    $("btnExport").addEventListener("click", exportCSV);
  }

  function wireAutoDefaults() {
    $("in_type").addEventListener("change", () => {
      applyTypeDefaults();
      toast(state.lang === "cz" ? "Defaulty upraveny dle typu firmy." : "Defaults set by company type.");
    });

    $("in_mode").addEventListener("change", () => {
      applyTypeDefaults();
    });
  }

  // =========================
  // Init
  // =========================
  function init() {
    wireInfoToggles();
    wireTabs();
    wireLang();
    wireButtons();
    wireAutoDefaults();

    // set initial view + lang
    setLang(state.lang);
    applyTypeDefaults();
    renderWL();
    showView("model");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

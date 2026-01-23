(() => {
  "use strict";
  

  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const LS = {
    lang: "ea_lang_v1",
    watch: "ea_watchlist_v1",
  };

  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => (t.style.display = "none"), 2400);
  }

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  // robust parse: accepts "1 234,56" | "1,234.56" | "1234.56" | "1234,56"
  function parseNum(v) {
    if (v == null) return NaN;
    let s = String(v).trim();
    if (!s) return NaN;

    // remove spaces
    s = s.replace(/\s+/g, "");

    // if contains both "," and ".", guess decimal is the last one
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    if (hasComma && hasDot) {
      // decimal = last occurrence among comma/dot
      const lastComma = s.lastIndexOf(",");
      const lastDot = s.lastIndexOf(".");
      const decIsComma = lastComma > lastDot;
      // remove thousand separators, normalize decimal to "."
      if (decIsComma) {
        s = s.replace(/\./g, "");
        s = s.replace(",", ".");
      } else {
        s = s.replace(/,/g, "");
      }
    } else if (hasComma && !hasDot) {
      // comma is decimal
      s = s.replace(",", ".");
    }
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fmt(n, currency = "", digits = 2) {
    if (!Number.isFinite(n)) return "—";
    const v = n.toLocaleString(undefined, { maximumFractionDigits: digits });
    return currency ? `${v} ${currency}` : v;
  }

  function pct(n, digits = 1) {
    if (!Number.isFinite(n)) return "—";
    const v = n.toFixed(digits);
    return `${v}%`;
  }

  function readSelect(id) {
    const el = $(id);
    return el ? String(el.value || "") : "";
  }

  function setSelectOptionsText(selId, optionsText) {
    const sel = $(selId);
    if (!sel) return;
    const opts = Array.from(sel.options);
    for (const o of opts) {
      const key = o.value;
      if (optionsText[key] != null) o.textContent = optionsText[key];
    }
  }

  function setInputPlaceholder(id, text) {
    const el = $(id);
    if (el) el.placeholder = text;
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    const el = $(id);
    if (el) el.innerHTML = html;
  }

  // =========================
  // Tooltip popover (tap-friendly)
  // =========================
  let tipPop = null;
  let tipPopOpenFor = null;

  function ensureTipPop() {
    if (tipPop) return tipPop;
    tipPop = document.createElement("div");
    tipPop.id = "tipPop";
    tipPop.style.position = "fixed";
    tipPop.style.zIndex = "2000";
    tipPop.style.maxWidth = "min(360px, 86vw)";
    tipPop.style.padding = "12px 12px";
    tipPop.style.borderRadius = "14px";
    tipPop.style.background = "rgba(8,6,20,.96)";
    tipPop.style.color = "#f2efff";
    tipPop.style.border = "1px solid rgba(195,140,255,.28)";
    tipPop.style.boxShadow = "0 18px 50px rgba(0,0,0,.55)";
    tipPop.style.fontSize = "12px";
    tipPop.style.lineHeight = "1.35";
    tipPop.style.display = "none";
    tipPop.style.backdropFilter = "blur(6px)";
    tipPop.style.webkitBackdropFilter = "blur(6px)";
    document.body.appendChild(tipPop);

    // close on outside click
    document.addEventListener("click", (e) => {
      if (!tipPop || tipPop.style.display === "none") return;
      const target = e.target;
      const insidePop = tipPop.contains(target);
      const isInfo = target && target.classList && target.classList.contains("info");
      if (!insidePop && !isInfo) hideTipPop();
    });

    // close on scroll
    window.addEventListener("scroll", () => {
      if (tipPop && tipPop.style.display !== "none") hideTipPop();
    }, { passive: true });

    window.addEventListener("resize", () => {
      if (tipPop && tipPop.style.display !== "none") hideTipPop();
    });

    return tipPop;
  }

  function showTipPop(anchorEl, text) {
    const pop = ensureTipPop();
    pop.textContent = text;

    const r = anchorEl.getBoundingClientRect();
    const pad = 10;

    // default above
    let top = r.top - pad;
    let left = r.left + r.width / 2;

    pop.style.display = "block";
    const pr = pop.getBoundingClientRect();

    // position
    left = left - pr.width / 2;
    left = clamp(left, 10, window.innerWidth - pr.width - 10);

    // above if possible else below
    let desiredTop = r.top - pr.height - pad;
    if (desiredTop < 10) desiredTop = r.bottom + pad;
    top = clamp(desiredTop, 10, window.innerHeight - pr.height - 10);

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    tipPopOpenFor = anchorEl;
  }

  function hideTipPop() {
    if (!tipPop) return;
    tipPop.style.display = "none";
    tipPopOpenFor = null;
  }

  function toggleTipPop(el) {
    const text = el.getAttribute("data-tip") || "";
    if (!text) return;
    if (tipPopOpenFor === el && tipPop && tipPop.style.display !== "none") {
      hideTipPop();
      return;
    }
    showTipPop(el, text);
  }

  // =========================
  // i18n (EN/CZ)
  // =========================
  const I18N = {
    en: {
      appTitle: "Equity Analyzer",
      appSub: "DCF fair value • Watchlist • Education",

      tabs: { model: "DCF Model", watch: "Watchlist", about: "About" },

      buttons: {
        demo: "Demo values",
        saveTop: "Save to Watchlist",
        calc: "Calculate",
        reset: "Reset",
        save: "Save result",
        export: "Export CSV",
        clear: "Clear",
        back: "Back",
      },

      inputsTitle: "Inputs",
      inputsDesc:
        "Multi-scenario DCF with guardrails. Use ranges (Bear/Base/Bull) and stay conservative.",
      modePill: (m) => `MODE: ${m === "quick" ? "Quick" : "Manual"}`,

      // labels/hints
      ticker: "Ticker / Name",
      tickerHint: "Used for watchlist label.",
      currency: "Currency",
      currencyHint: "All inputs should be in selected currency.",
      type: "Company type",
      typeHint: "Sets reasonable defaults + warnings (you can override).",
      mode: "Mode",
      modeHint: "Quick: set Base; Bear/Bull derived (± spread default).",
      price: "Current price (optional)",
      priceHint: "Used only for upside / margin-of-safety view.",
      mos: "Margin of Safety",
      mosHint: "Applied after valuation (to Base) for a conservative target.",
      method: "DCF method",
      methodHint: "If you don’t know FCF, estimate it via revenue × margin.",
      years: "Projection (years)",
      yearsHint: "Commonly 5–10 years depending on predictability.",
      fcf: "FCF (TTM or 3–5y avg)",
      fcfHint: "Prefer a 3–5y average for cyclical firms.",
      units: "Units",
      unitsHint: "Optional: enter values in millions/billions for comfort.",
      shares: "Shares (diluted)",
      sharesHint: "Used to compute fair value per share.",
      cash: "Cash (optional)",
      cashHint: "Added to enterprise value (EV → Equity).",
      debt: "Debt (optional)",
      debtHint: "Subtracted to get equity value.",

      assumpTitle: "Assumptions (3 scenarios)",
      assumpDesc: "Bear/Base/Bull ranges help avoid false precision.",
      guard: "Guardrails ON",
      disc: "Discount rate (base) %",
      discHint: "Higher risk → higher discount → lower fair value.",
      term: "Terminal growth %",
      termHint: "Long-run growth after projection. Keep conservative.",
      baseg: "Base FCF growth %",
      basegHint: "Annual growth during projection.",
      spread: "Quick spread (± pp)",
      spreadHint: "Quick mode derives Bear/Base/Bull = Base ± spread.",
      quickTip:
        "Tip: In Quick mode you set only Base; Bear/Bull are derived automatically.",

      outputsTitle: "Outputs",
      outputsDesc: "Fair value range + sanity checks.",
      outBase: "Fair value (Base)",
      outBaseSub: "Bear/Bull below.",
      outRange: "Range (Bear → Bull)",
      outRangeSub: "Use range, not a single number.",
      outUpside: "Upside vs price",
      outUpsideSub: "Needs current price (optional).",
      outWarn: "Warnings / checks",
      outWarnSub: "—",
      detailsSum: "Details",
      detailsEmpty: "Enter inputs and press Calculate.",

      // selects
      sel: {
        type: { growth: "Growth / Tech", mature: "Mature / Blue-chip", cyclical: "Cyclical" },
        mode: { quick: "Quick (Bear/Bull auto)", manual: "Manual (enter all 3)" },
        mos: { "0": "OFF", "10": "10%", "15": "15%", "20": "20%", "30": "30%" },
        method: { fcf: "Direct FCF (recommended)", rev: "Revenue × FCF margin" },
        units: { raw: "Raw numbers", m: "Millions", b: "Billions" },
      },

      // tooltips
      tips: {
        ticker: "Used as label in Watchlist. Example: AAPL / SOFI / PLTR",
        currency: "All inputs should be in the selected currency (FCF, cash, debt, price).",
        type: "Sets default assumptions + warnings. You can override.",
        mode: "Quick: enter Base; Bear/Bull derived automatically (± spread).",
        price: "Only for upside / margin-of-safety view.",
        mos: "Applied after valuation (to Base) for a conservative target.",
        method: "Direct FCF is recommended. If you don't know FCF, estimate from revenue × margin.",
        years: "Commonly 5–10 years depending on predictability.",
        fcf: "Prefer 3–5y average for cyclical firms (avoid one great year).",
        units: "Optional: you can enter values in millions/billions for comfort.",
        shares: "Use diluted shares (basic + SBC impact).",
        cash: "Added to enterprise value (EV → Equity). Use cash & equivalents.",
        debt: "Subtracted to get equity value. Use total debt (short + long term).",
        disc: "Higher risk → higher discount → lower fair value.",
        term: "Long-run growth after projection. Keep conservative (often 2–3%).",
        baseg: "Annual growth during projection. Use realistic assumptions.",
        spread: "Quick mode derives Bear/Base/Bull = Base ± spread.",
      },

      // watchlist
      wlTitle: "Watchlist",
      wlDesc:
        "Saved results are stored locally in your browser (localStorage). Different device = different watchlist.",
      wlNote:
        "Note: Watchlist is stored locally in your browser (localStorage). Different device = different watchlist.",
      wlCols: { name: "Name", base: "Base", range: "Range", price: "Price", upside: "Upside", act: "Action" },
      wlEmpty: "No saved items yet.",

      // about (expanded)
      aboutTitle: "About Equity Analyzer",
      aboutSubtitle: "Educational valuation tool based on a multi-scenario DCF model.",
      aboutWhat: "What this tool is",
      aboutWhatBody:
        "Equity Analyzer estimates intrinsic value per share using a discounted cash flow (DCF) approach. It is designed to encourage thinking in ranges (Bear/Base/Bull) rather than one precise number, and to show how sensitive valuation is to growth and discount rates.",
      aboutHow: "How to use it (step-by-step)",
      aboutHowBody: `
        <ol style="margin:0; padding-left:18px;">
          <li><b>Choose Company Type</b> to load reasonable defaults (Growth/Mature/Cyclical).</li>
          <li><b>Set FCF</b> as TTM or (better for cyclicals) 3–5y average to avoid a one-off peak year.</li>
          <li><b>Set Projection Years</b> (commonly 5–10). More uncertainty → shorter horizon.</li>
          <li><b>Discount Rate</b>: use higher rate for riskier firms. This is the most important lever.</li>
          <li><b>Terminal Growth</b>: keep conservative (often 2–3%). Must be below discount rate.</li>
          <li><b>Shares (diluted)</b>: use diluted shares to reflect SBC and convert equity value to per-share.</li>
          <li><b>Cash/Debt</b> (optional): add cash, subtract debt to move from EV to equity value.</li>
          <li><b>Quick mode</b>: enter Base growth; Bear/Bull = Base ± spread. <b>Manual mode</b>: you enter all scenarios (advanced).</li>
        </ol>
      `,
      aboutData: "Where to find inputs",
      aboutDataBody: `
        Typical sources:
        <ul style="margin:8px 0 0; padding-left:18px;">
          <li><b>10-K / 10-Q</b> (SEC filings) or annual reports</li>
          <li>Company investor relations presentations</li>
          <li>Cash flow statement for FCF (CFO − CapEx)</li>
          <li>Balance sheet for cash & debt</li>
          <li>Weighted average shares diluted in filings</li>
        </ul>
      `,
      aboutNotAdvice: "Important: not financial advice",
      aboutNotAdviceBody:
        "This application is <b>NOT financial advice</b>. It is for educational and analytical purposes only. Outputs depend entirely on your assumptions and inputs and may be wrong. Always verify data from primary sources and consider uncertainty and risk.",

      // messages
      msg: {
        demoLoaded: "Demo loaded",
        calculated: "Calculated",
        saved: "Saved to Watchlist",
        deleted: "Deleted",
        cleared: "Cleared",
        exportReady: "CSV exported",
        missingShares: "Shares must be > 0",
        missingFcf: "FCF must be a valid number",
        badRates: "Terminal growth must be below discount rate",
      }
    },

    cz: {
      appTitle: "Equity Analyzer",
      appSub: "DCF férová hodnota • Watchlist • Vysvětlení",

      tabs: { model: "DCF Model", watch: "Watchlist", about: "O aplikaci" },

      buttons: {
        demo: "Demo hodnoty",
        saveTop: "Uložit do Watchlistu",
        calc: "Spočítat",
        reset: "Reset",
        save: "Uložit výsledek",
        export: "Export CSV",
        clear: "Smazat vše",
        back: "Zpět",
      },

      inputsTitle: "Vstupy",
      inputsDesc:
        "DCF ve 3 scénářích s guardrails. Používej rozpětí (Bear/Base/Bull) a buď konzervativní.",
      modePill: (m) => `REŽIM: ${m === "quick" ? "Quick" : "Manual"}`,

      ticker: "Ticker / Název",
      tickerHint: "Použije se jako název ve Watchlistu.",
      currency: "Měna",
      currencyHint: "Všechny vstupy musí být ve zvolené měně.",
      type: "Typ firmy",
      typeHint: "Nastaví rozumné defaulty + upozornění (můžeš změnit).",
      mode: "Režim",
      modeHint: "Quick: nastavíš Base; Bear/Bull se dopočítají (± spread).",
      price: "Aktuální cena (volitelně)",
      priceHint: "Pouze pro výpočet upside / margin-of-safety.",
      mos: "Margin of Safety",
      mosHint: "Aplikuje se po výpočtu (na Base) pro konzervativní cíl.",
      method: "DCF metoda",
      methodHint: "Pokud neznáš FCF, odhadni přes revenue × margin.",
      years: "Projekce (roky)",
      yearsHint: "Nejčastěji 5–10 let podle predikovatelnosti.",
      fcf: "FCF (TTM nebo průměr 3–5 let)",
      fcfHint: "U cyklických firem preferuj průměr 3–5 let.",
      units: "Jednotky",
      unitsHint: "Volitelně: můžeš psát miliony/miliardy pro pohodlí.",
      shares: "Počet akcií (diluted)",
      sharesHint: "Použije se pro výpočet férové hodnoty na akcii.",
      cash: "Cash (volitelně)",
      cashHint: "Přičítá se k EV (EV → Equity).",
      debt: "Dluh (volitelně)",
      debtHint: "Odečítá se pro výpočet equity hodnoty.",

      assumpTitle: "Předpoklady (3 scénáře)",
      assumpDesc: "Rozpětí Bear/Base/Bull pomáhá vyhnout se falešné přesnosti.",
      guard: "Guardrails ON",
      disc: "Diskontní sazba (base) %",
      discHint: "Vyšší riziko → vyšší diskont → nižší férová hodnota.",
      term: "Terminální růst %",
      termHint: "Dlouhodobý růst po projekci. Drž konzervativně.",
      baseg: "Růst FCF (Base) %",
      basegHint: "Roční růst v období projekce.",
      spread: "Quick spread (± p.b.)",
      spreadHint: "Quick režim: Bear/Base/Bull = Base ± spread.",
      quickTip:
        "Tip: V Quick režimu nastavuješ jen Base; Bear/Bull se dopočítají automaticky.",

      outputsTitle: "Výstupy",
      outputsDesc: "Rozpětí férové hodnoty + sanity checks.",
      outBase: "Férová hodnota (Base)",
      outBaseSub: "Bear/Bull níže.",
      outRange: "Rozpětí (Bear → Bull)",
      outRangeSub: "Používej rozpětí, ne jedno číslo.",
      outUpside: "Upside vs cena",
      outUpsideSub: "Potřebuje aktuální cenu (volitelně).",
      outWarn: "Upozornění / kontroly",
      outWarnSub: "—",
      detailsSum: "Detaily",
      detailsEmpty: "Vyplň vstupy a klikni Spočítat.",

      sel: {
        type: { growth: "Growth / Tech", mature: "Mature / Blue-chip", cyclical: "Cyclical" },
        mode: { quick: "Quick (Bear/Bull auto)", manual: "Manual (zadáš všechny 3)" },
        mos: { "0": "VYP", "10": "10%", "15": "15%", "20": "20%", "30": "30%" },
        method: { fcf: "Přímé FCF (doporučeno)", rev: "Revenue × FCF margin" },
        units: { raw: "Celá čísla", m: "Miliony", b: "Miliardy" },
      },

      tips: {
        ticker: "Použije se jako název ve Watchlistu. Příklad: AAPL / SOFI / PLTR",
        currency: "Všechny vstupy zadávej ve zvolené měně (FCF, cash, dluh, cena).",
        type: "Nastaví defaulty a varování podle typu firmy. Můžeš upravit ručně.",
        mode: "Quick: zadáš Base; Bear/Bull se dopočítají automaticky (± spread).",
        price: "Pouze pro upside / margin-of-safety.",
        mos: "Aplikuje se po výpočtu (na Base) pro konzervativní cíl.",
        method: "Doporučeno je přímé FCF. Když FCF neznáš, odhadni z revenue × margin.",
        years: "Obvykle 5–10 let. Čím větší nejistota, tím kratší horizont.",
        fcf: "U cyklických firem raději průměr 3–5 let (vyhneš se špičkovému roku).",
        units: "Můžeš psát miliony nebo miliardy (jen pro komfort).",
        shares: "Použij diluted shares (zohlední SBC) pro férovou cenu na akcii.",
        cash: "Přičítá se k EV (EV → Equity). Použij cash & equivalents.",
        debt: "Odečítá se pro equity value. Použij total debt (krátký + dlouhý).",
        disc: "Vyšší riziko → vyšší diskont → nižší férová hodnota.",
        term: "Drž konzervativně (typicky 2–3 %). Musí být pod diskontní sazbou.",
        baseg: "Roční růst FCF v projekci. Drž realisticky.",
        spread: "Quick: Bear/Base/Bull = Base ± spread.",
      },

      wlTitle: "Watchlist",
      wlDesc:
        "Uložené výpočty se ukládají lokálně v prohlížeči (localStorage). Jiný telefon/PC = jiný watchlist.",
      wlNote:
        "Pozn.: Watchlist je uložen lokálně v prohlížeči (localStorage). Jiný telefon/PC = jiný watchlist.",
      wlCols: { name: "Název", base: "Base", range: "Rozpětí", price: "Cena", upside: "Upside", act: "Akce" },
      wlEmpty: "Zatím nic uložené.",

      aboutTitle: "O aplikaci Equity Analyzer",
      aboutSubtitle: "Vzdělávací valuace postavená na multi-scenario DCF modelu.",
      aboutWhat: "Co to dělá",
      aboutWhatBody:
        "Equity Analyzer odhaduje vnitřní (férovou) hodnotu akcie pomocí DCF (Discounted Cash Flow). Aplikace je záměrně postavená na rozpětí (Bear/Base/Bull), aby se člověk vyhnul falešné přesnosti jednoho čísla a viděl citlivost na růst a diskont.",
      aboutHow: "Jak to používat (podrobný návod)",
      aboutHowBody: `
        <ol style="margin:0; padding-left:18px;">
          <li><b>Vyber Typ firmy</b> (Growth/Mature/Cyclical) → nastaví rozumné defaulty.</li>
          <li><b>FCF</b>: ideálně TTM; u cyklických firem použij <b>průměr 3–5 let</b>.</li>
          <li><b>Projekce (roky)</b>: obvykle 5–10 let. Čím větší nejistota, tím kratší horizont.</li>
          <li><b>Diskont</b>: nejdůležitější páka. Rizikovější firma = vyšší diskont.</li>
          <li><b>Terminální růst</b>: drž konzervativně (typicky 2–3 %) a <b>musí být menší než diskont</b>.</li>
          <li><b>Počet akcií (diluted)</b>: použij diluted shares kvůli SBC → férová cena na akcii bude realističtější.</li>
          <li><b>Cash/Dluh</b>: volitelně přičti cash a odečti dluh (EV → Equity).</li>
          <li><b>Quick režim</b>: zadáš Base růst; Bear/Bull se dopočítají. <b>Manual</b>: zadáš scénáře ručně (pokročilé).</li>
        </ol>
      `,
      aboutData: "Kde najít vstupy",
      aboutDataBody: `
        Nejčastější zdroje:
        <ul style="margin:8px 0 0; padding-left:18px;">
          <li><b>10-K / 10-Q</b> (výkazy, annual report)</li>
          <li>Investor relations prezentace</li>
          <li>Cash Flow statement pro FCF (CFO − CapEx)</li>
          <li>Balance sheet pro cash & dluh</li>
          <li>Weighted average shares diluted ve výkazech</li>
        </ul>
      `,
      aboutNotAdvice: "Důležité: není to finanční doporučení",
      aboutNotAdviceBody:
        "Tahle aplikace <b>NENÍ finanční doporučení</b>. Slouží pouze pro vzdělávání a analytické účely. Výstupy závisí na tvých předpokladech a vstupech a mohou být chybné. Vždy ověř data z primárních zdrojů a počítej s nejistotou.",

      msg: {
        demoLoaded: "Demo načteno",
        calculated: "Spočítáno",
        saved: "Uloženo do Watchlistu",
        deleted: "Smazáno",
        cleared: "Smazáno",
        exportReady: "CSV export hotový",
        missingShares: "Počet akcií musí být > 0",
        missingFcf: "FCF musí být platné číslo",
        badRates: "Terminální růst musí být menší než diskont",
      }
    }
  };

  // =========================
  // App state
  // =========================
  const state = {
    lang: "en",
    view: "model",
    mode: "quick",
    lastResult: null,
  };

  // =========================
  // Units scaling
  // =========================
  function unitScale() {
    const u = readSelect("in_units");
    if (u === "m") return 1_000_000;
    if (u === "b") return 1_000_000_000;
    return 1;
  }

  // =========================
  // View navigation
  // =========================
  function showView(view) {
    state.view = view;

    const views = {
      model: $("viewModel"),
      watchlist: $("viewWatchlist"),
      about: $("viewAbout"),
    };

    for (const k of Object.keys(views)) {
      const el = views[k];
      if (!el) continue;
      el.classList.toggle("hidden", k !== view);
    }

    // tabs active class
    const tabModel = $("tabModel");
    const tabWatch = $("tabWatch");
    const tabAbout = $("tabAbout");
    if (tabModel) tabModel.classList.toggle("active", view === "model");
    if (tabWatch) tabWatch.classList.toggle("active", view === "watchlist");
    if (tabAbout) tabAbout.classList.toggle("active", view === "about");

    // also update pill in header buttons (optional)
    hideTipPop();
  }

  // =========================
  // Language
  // =========================
  function setLang(lang) {
    state.lang = lang === "cz" ? "cz" : "en";
    localStorage.setItem(LS.lang, state.lang);

    // buttons state
    const btnEN = $("btnEN");
    const btnCZ = $("btnCZ");
    if (btnEN) btnEN.classList.toggle("active", state.lang === "en");
    if (btnCZ) btnCZ.classList.toggle("active", state.lang === "cz");

    const t = I18N[state.lang];

    // header / tabs / buttons
    setText("t_appTitle", t.appTitle);
    setText("t_appSub", t.appSub);

    setText("tabModel", t.tabs.model);
    setText("tabWatch", t.tabs.watch);
    setText("tabAbout", t.tabs.about);

    setText("btnDemo", t.buttons.demo);
    setText("btnSaveTop", t.buttons.saveTop);

    setText("t_inputsTitle", t.inputsTitle);
    setText("t_inputsDesc", t.inputsDesc);
    setText("pillMode", t.modePill(state.mode));

    // labels
    setText("t_ticker", t.ticker);
    setText("t_tickerHint", t.tickerHint);
    setText("t_currency", t.currency);
    setText("t_currencyHint", t.currencyHint);
    setText("t_type", t.type);
    setText("t_typeHint", t.typeHint);
    setText("t_mode", t.mode);
    setText("t_modeHint", t.modeHint);
    setText("t_price", t.price);
    setText("t_priceHint", t.priceHint);
    setText("t_mos", t.mos);
    setText("t_mosHint", t.mosHint);
    setText("t_method", t.method);
    setText("t_methodHint", t.methodHint);
    setText("t_years", t.years);
    setText("t_yearsHint", t.yearsHint);
    setText("t_fcf", t.fcf);
    setText("t_fcfHint", t.fcfHint);
    setText("t_units", t.units);
    setText("t_unitsHint", t.unitsHint);
    setText("t_shares", t.shares);
    setText("t_sharesHint", t.sharesHint);
    setText("t_cash", t.cash);
    setText("t_cashHint", t.cashHint);
    setText("t_debt", t.debt);
    setText("t_debtHint", t.debtHint);

    // assumptions
    setText("t_assumpTitle", t.assumpTitle);
    setText("t_assumpDesc", t.assumpDesc);
    setText("pillGuard", t.guard);
    setText("t_disc", t.disc);
    setText("t_discHint", t.discHint);
    setText("t_term", t.term);
    setText("t_termHint", t.termHint);
    setText("t_baseg", t.baseg);
    setText("t_basegHint", t.basegHint);
    setText("t_spread", t.spread);
    setText("t_spreadHint", t.spreadHint);
    setText("btnCalc", t.buttons.calc);
    setText("btnReset", t.buttons.reset);
    setText("btnSave", t.buttons.save);
    setText("t_quickTip", t.quickTip);

    // outputs
    setText("t_outTitle", t.outputsTitle);
    setText("t_outDesc", t.outputsDesc);
    setText("t_outBase", t.outBase);
    setText("t_outBaseSub", t.outBaseSub);
    setText("t_outRange", t.outRange);
    setText("t_outRangeSub", t.outRangeSub);
    setText("t_outUpside", t.outUpside);
    setText("t_outUpsideSub", t.outUpsideSub);
    setText("t_outWarn", t.outWarn);
    setText("t_outWarnSub", t.outWarnSub);
    setText("t_detailsSum", t.detailsSum);

    // placeholders
    setInputPlaceholder("in_ticker", state.lang === "cz" ? "např. AAPL / SOFI / PLTR" : "e.g., AAPL / SOFI / PLTR");
    setInputPlaceholder("in_price", state.lang === "cz" ? "např. 180,50" : "e.g., 180.50");
    setInputPlaceholder("in_years", "10");
    setInputPlaceholder("in_fcf", state.lang === "cz" ? "např. 11000000000" : "e.g., 11000000000");
    setInputPlaceholder("in_shares", state.lang === "cz" ? "např. 15500000000" : "e.g., 15500000000");
    setInputPlaceholder("in_cash", state.lang === "cz" ? "např. 50000000000" : "e.g., 50000000000");
    setInputPlaceholder("in_debt", state.lang === "cz" ? "např. 70000000000" : "e.g., 70000000000");
    setInputPlaceholder("in_disc", "9");
    setInputPlaceholder("in_term", "2.5");
    setInputPlaceholder("in_base", "12");
    setInputPlaceholder("in_spread", "2");

    // selects labels
    setSelectOptionsText("in_type", t.sel.type);
    setSelectOptionsText("in_mode", t.sel.mode);
    setSelectOptionsText("in_mos", t.sel.mos);
    setSelectOptionsText("in_method", t.sel.method);
    setSelectOptionsText("in_units", t.sel.units);

    // watchlist texts
    setText("t_wlTitle", t.wlTitle);
    setText("t_wlDesc", t.wlDesc);
    setText("t_wlNote", t.wlNote);
    setText("t_wlColName", t.wlCols.name);
    setText("t_wlColBase", t.wlCols.base);
    setText("t_wlColRange", t.wlCols.range);
    setText("t_wlColPrice", t.wlCols.price);
    setText("t_wlColUpside", t.wlCols.upside);
    setText("t_wlColAct", t.wlCols.act);
    setText("btnExport", t.buttons.export);
    setText("btnClearWL", t.buttons.clear);
    setText("btnBackFromWL", t.buttons.back);

    // about (expanded)
    setText("t_aboutTitle", t.aboutTitle);
    setText("t_aboutSubtitle", t.aboutSubtitle);
    setText("t_aboutWhat", t.aboutWhat);
    setHTML("t_aboutWhatBody", t.aboutWhatBody);
    setText("t_aboutHow", t.aboutHow);
    setHTML("t_aboutHowBody", t.aboutHowBody);
    setText("t_aboutData", t.aboutData);
    setHTML("t_aboutDataBody", t.aboutDataBody);
    setText("t_aboutNotAdvice", t.aboutNotAdvice);
    setHTML("t_aboutNotAdviceBody", t.aboutNotAdviceBody);
    setText("btnBackFromAbout", t.buttons.back);

    // tooltips (data-tip) — IMPORTANT: supports tap popover too
    applyTooltips();

    // refresh watchlist render to update "Load/Delete" buttons
    renderWatchlist();

    // close popover if open
    hideTipPop();
  }

  function applyTooltips() {
    const t = I18N[state.lang];
    // map tooltip nodes by their position: each field has 1 info icon
    // We bind them by the nearest label's "for" attribute to keep it stable.
    qsa(".field .info").forEach((info) => {
      const field = info.closest(".field");
      const lab = field ? qs("label", field) : null;
      const forId = lab ? lab.getAttribute("for") : null;
      if (!forId) return;

      // Assign tip by input id
      const map = t.tips;
      const keyByFor = {
        in_ticker: "ticker",
        in_currency: "currency",
        in_type: "type",
        in_mode: "mode",
        in_price: "price",
        in_mos: "mos",
        in_method: "method",
        in_years: "years",
        in_fcf: "fcf",
        in_units: "units",
        in_shares: "shares",
        in_cash: "cash",
        in_debt: "debt",
        in_disc: "disc",
        in_term: "term",
        in_base: "baseg",
        in_spread: "spread",
      };

      const k = keyByFor[forId];
      if (!k || !map[k]) return;
      info.setAttribute("data-tip", map[k]);
    });

    // ensure click works (mobile)
    qsa(".info").forEach((info) => {
      if (info._tipBound) return;
      info._tipBound = true;
      info.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTipPop(info);
      });
      // keyboard
      info.setAttribute("tabindex", "0");
      info.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTipPop(info);
        }
      });
    });
  }

  // =========================
  // Defaults by company type
  // =========================
  function applyTypeDefaults() {
    const type = readSelect("in_type");
    // Don't overwrite if user already typed; but we can set if empty
    const discEl = $("in_disc");
    const termEl = $("in_term");
    const baseEl = $("in_base");
    const spreadEl = $("in_spread");
    if (!discEl || !termEl || !baseEl || !spreadEl) return;

    const discVal = parseNum(discEl.value);
    const termVal = parseNum(termEl.value);
    const baseVal = parseNum(baseEl.value);
    const sprVal = parseNum(spreadEl.value);

    const fillIfNaN = (el, v) => {
      const cur = parseNum(el.value);
      if (!Number.isFinite(cur)) el.value = String(v);
    };

    if (type === "growth") {
      fillIfNaN(discEl, 9);
      fillIfNaN(termEl, 2.5);
      fillIfNaN(baseEl, 12);
      fillIfNaN(spreadEl, 2);
    } else if (type === "mature") {
      fillIfNaN(discEl, 8);
      fillIfNaN(termEl, 2.0);
      fillIfNaN(baseEl, 6);
      fillIfNaN(spreadEl, 1.5);
    } else if (type === "cyclical") {
      fillIfNaN(discEl, 10);
      fillIfNaN(termEl, 2.0);
      fillIfNaN(baseEl, 4);
      fillIfNaN(spreadEl, 2.5);
    }

    // update outputs maybe
  }

  // =========================
  // Valuation model
  // =========================
  function computeDCFScenario({ fcf0, g, r, gT, years }) {
    // PV of growing annuity for years (FCF grows at g)
    // FCF_t = FCF0 * (1+g)^t, t=1..years
    // PV = sum FCF_t / (1+r)^t
    let pvCF = 0;
    for (let t = 1; t <= years; t++) {
      const f = fcf0 * Math.pow(1 + g, t);
      pvCF += f / Math.pow(1 + r, t);
    }

    // Terminal Value at year N using Gordon Growth on FCF_{N+1}
    const fN = fcf0 * Math.pow(1 + g, years);
    const fN1 = fN * (1 + gT);
    const tv = fN1 / (r - gT);
    const pvTV = tv / Math.pow(1 + r, years);

    return { pvCF, tv, pvTV, equityEV: pvCF + pvTV };
  }

  function compute() {
    const t = I18N[state.lang];

    const currency = readSelect("in_currency") || "USD";
    const years = Math.round(parseNum($("in_years")?.value));
    const r = parseNum($("in_disc")?.value) / 100;
    const gT = parseNum($("in_term")?.value) / 100;
    const baseG = parseNum($("in_base")?.value) / 100;
    const spread = parseNum($("in_spread")?.value) / 100;

    const units = unitScale();

    const fcfRaw = parseNum($("in_fcf")?.value);
    const sharesRaw = parseNum($("in_shares")?.value);
    const cashRaw = parseNum($("in_cash")?.value);
    const debtRaw = parseNum($("in_debt")?.value);
    const priceRaw = parseNum($("in_price")?.value);
    const mos = parseNum(readSelect("in_mos")) / 100;

    // validations
    if (!Number.isFinite(fcfRaw)) {
      toast(t.msg.missingFcf);
      setText("out_warn", "—");
      setText("out_details", t.detailsEmpty);
      return;
    }
    if (!Number.isFinite(sharesRaw) || sharesRaw <= 0) {
      toast(t.msg.missingShares);
      setText("out_warn", "—");
      setText("out_details", t.detailsEmpty);
      return;
    }
    if (!Number.isFinite(years) || years < 1 || years > 50) {
      toast(state.lang === "cz" ? "Roky musí být 1–50" : "Years must be 1–50");
      return;
    }
    if (!Number.isFinite(r) || !Number.isFinite(gT) || r <= gT) {
      toast(t.msg.badRates);
      return;
    }

    const fcf0 = fcfRaw * units;
    const shares = sharesRaw; // shares are already raw count, do NOT scale by units

    const cash = Number.isFinite(cashRaw) ? cashRaw * units : 0;
    const debt = Number.isFinite(debtRaw) ? debtRaw * units : 0;

    // scenarios
    const mode = readSelect("in_mode") || "quick";
    state.mode = mode;
    setText("pillMode", t.modePill(mode));

    // in this app we always use quick formula for 3 scenarios
    // If later you add manual inputs, you can extend.
    const gBear = baseG - spread;
    const gBull = baseG + spread;

    const resBear = computeDCFScenario({ fcf0, g: gBear, r, gT, years });
    const resBase = computeDCFScenario({ fcf0, g: baseG, r, gT, years });
    const resBull = computeDCFScenario({ fcf0, g: gBull, r, gT, years });

    // EV -> Equity
    const eqBear = resBear.equityEV + cash - debt;
    const eqBase = resBase.equityEV + cash - debt;
    const eqBull = resBull.equityEV + cash - debt;

    let perBear = eqBear / shares;
    let perBase = eqBase / shares;
    let perBull = eqBull / shares;

    // MOS applies to Base output only (conservative target)
    const perBaseMOS = mos > 0 ? perBase * (1 - mos) : perBase;

    // upside
    let upside = NaN;
    if (Number.isFinite(priceRaw) && priceRaw > 0) {
      upside = ((perBaseMOS / priceRaw) - 1) * 100;
    }

    // warnings
    const warns = [];
    if (gBull > r - 0.005) warns.push(state.lang === "cz" ? "Bull růst je moc blízko diskontu (citlivé)." : "Bull growth is too close to discount rate (very sensitive).");
    if (gT > 0.03) warns.push(state.lang === "cz" ? "Terminální růst je vysoký (zkus 2–3 %)." : "Terminal growth looks high (try 2–3%).");
    if (years > 15) warns.push(state.lang === "cz" ? "Dlouhá projekce → větší nejistota." : "Long projection horizon → higher uncertainty.");
    if (fcf0 < 0) warns.push(state.lang === "cz" ? "FCF je záporné (DCF může být zavádějící)." : "FCF is negative (DCF may be misleading).");

    const warnText = warns.length ? (warns.length > 2 ? `${warns[0]} • ${warns[1]}…` : warns.join(" • ")) : "—";
    setText("out_warn", warnText);
    setText("t_outWarnSub", warns.length ? (state.lang === "cz" ? "Zkontroluj předpoklady." : "Double-check assumptions.") : "—");

    // outputs
    const cur = currency;
    setText("out_base", fmt(perBaseMOS, cur, 2));
    setText("out_range", `${fmt(perBear, cur, 2)} → ${fmt(perBull, cur, 2)}`);

    if (Number.isFinite(upside)) {
      setText("out_upside", pct(upside, 2));
      setText("t_outUpsideSub", state.lang === "cz" ? "Porovnání vůči ceně." : "Compared to current price.");
    } else {
      setText("out_upside", "—");
      setText("t_outUpsideSub", t.outUpsideSub);
    }

    setText("pillReady", state.lang === "cz" ? "HOTOVO" : "READY");

    // details
    const ticker = ($("in_ticker")?.value || "").trim();
    const name = ticker || (state.lang === "cz" ? "Bez názvu" : "Untitled");

    const details = `
      <div><b>${state.lang === "cz" ? "Scénáře" : "Scenarios"}</b>: Bear / Base / Bull</div>
      <div style="margin-top:8px;">
        <div>${state.lang === "cz" ? "Roky" : "Years"}: <b>${years}</b></div>
        <div>${state.lang === "cz" ? "Diskont" : "Discount"}: <b>${pct(r * 100, 2)}</b></div>
        <div>${state.lang === "cz" ? "Terminál" : "Terminal"}: <b>${pct(gT * 100, 2)}</b></div>
        <div>${state.lang === "cz" ? "Růst Base" : "Base growth"}: <b>${pct(baseG * 100, 2)}</b></div>
        <div>${state.lang === "cz" ? "Spread" : "Spread"}: <b>${pct(spread * 100, 2)}</b></div>
      </div>
      <div style="margin-top:10px;"><b>${state.lang === "cz" ? "Výsledky (na akcii)" : "Results (per share)"}</b></div>
      <div>${state.lang === "cz" ? "Bear" : "Bear"}: <b>${fmt(perBear, cur, 2)}</b></div>
      <div>${state.lang === "cz" ? "Base" : "Base"}: <b>${fmt(perBase, cur, 2)}</b></div>
      <div>${state.lang === "cz" ? "Bull" : "Bull"}: <b>${fmt(perBull, cur, 2)}</b></div>
      <div style="margin-top:10px; color: rgba(242,239,255,.72)">
        ${state.lang === "cz"
          ? "Pozn.: Výstupy jsou citlivé na diskont a dlouhodobé předpoklady. Používej rozpětí."
          : "Note: Outputs are sensitive to discount rate and long-run assumptions. Use ranges."}
      </div>
    `;
    setHTML("out_details", details);

    state.lastResult = {
      name,
      ticker,
      currency: cur,
      date: new Date().toISOString().slice(0, 10),
      base: perBaseMOS,
      bear: perBear,
      bull: perBull,
      price: Number.isFinite(priceRaw) ? priceRaw : null,
      upside: Number.isFinite(upside) ? upside : null,
    };

    toast(t.msg.calculated);
  }

  // =========================
  // Watchlist
  // =========================
  function loadWatchlist() {
    try {
      const raw = localStorage.getItem(LS.watch);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWatchlist(items) {
    localStorage.setItem(LS.watch, JSON.stringify(items));
  }

  function renderWatchlist() {
    const t = I18N[state.lang];
    const body = $("wl_body");
    if (!body) return;

    const items = loadWatchlist();
    body.innerHTML = "";

    if (!items.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "muted";
      td.id = "t_wlEmpty";
      td.textContent = t.wlEmpty;
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    items.forEach((it, idx) => {
      const tr = document.createElement("tr");

      const tdName = document.createElement("td");
      tdName.innerHTML = `<b style="color:#f2efff">${escapeHtml(it.ticker || it.name || "")}</b><div style="color:rgba(242,239,255,.55); font-size:12px; margin-top:4px;">${escapeHtml(it.date || "")}</div>`;
      tr.appendChild(tdName);

      const tdBase = document.createElement("td");
      tdBase.textContent = fmt(it.base, it.currency || "", 2);
      tr.appendChild(tdBase);

      const tdRange = document.createElement("td");
      tdRange.textContent = `${fmt(it.bear, it.currency || "", 2)} → ${fmt(it.bull, it.currency || "", 2)}`;
      tr.appendChild(tdRange);

      const tdPrice = document.createElement("td");
      tdPrice.textContent = it.price != null ? fmt(it.price, it.currency || "", 2) : "—";
      tr.appendChild(tdPrice);

      const tdUps = document.createElement("td");
      tdUps.textContent = it.upside != null ? pct(it.upside, 2) : "—";
      tr.appendChild(tdUps);

      const tdAct = document.createElement("td");
      tdAct.innerHTML = `
        <button data-act="load" data-idx="${idx}" style="${miniBtnStyle()}">${state.lang === "cz" ? "Načíst" : "Load"}</button>
        <button data-act="del" data-idx="${idx}" style="${miniBtnStyle(true)}">${state.lang === "cz" ? "Smazat" : "Delete"}</button>
      `;
      tr.appendChild(tdAct);

      body.appendChild(tr);
    });

    // bind actions
    qsa("button[data-act]", body).forEach((b) => {
      b.addEventListener("click", () => {
        const act = b.getAttribute("data-act");
        const idx = Number(b.getAttribute("data-idx"));
        if (!Number.isFinite(idx)) return;
        if (act === "del") deleteWL(idx);
        if (act === "load") loadWL(idx);
      });
    });
  }

  function miniBtnStyle(danger = false) {
    return `
      appearance:none;border:1px solid rgba(255,255,255,.10);
      background:${danger ? "rgba(255,92,138,.12)" : "rgba(255,255,255,.06)"};
      color:${danger ? "#ffd1dd" : "#f2efff"};
      padding:8px 10px;border-radius:12px;
      font-weight:900;cursor:pointer;
      box-shadow:0 10px 20px rgba(0,0,0,.25);
      margin-right:8px;
    `;
  }

  function saveCurrentToWatchlist() {
    const t = I18N[state.lang];
    if (!state.lastResult) {
      toast(state.lang === "cz" ? "Nejdřív spočítej výsledek." : "Calculate first.");
      return;
    }
    const items = loadWatchlist();
    items.unshift({ ...state.lastResult });
    saveWatchlist(items);
    renderWatchlist();
    toast(t.msg.saved);
  }

  function deleteWL(idx) {
    const t = I18N[state.lang];
    const items = loadWatchlist();
    items.splice(idx, 1);
    saveWatchlist(items);
    renderWatchlist();
    toast(t.msg.deleted);
  }

  function loadWL(idx) {
    const items = loadWatchlist();
    const it = items[idx];
    if (!it) return;

    $("in_ticker").value = it.ticker || it.name || "";
    $("in_currency").value = it.currency || "USD";
    $("in_price").value = it.price != null ? String(it.price) : "";

    // set outputs from stored (without recompute)
    setText("out_base", fmt(it.base, it.currency || "", 2));
    setText("out_range", `${fmt(it.bear, it.currency || "", 2)} → ${fmt(it.bull, it.currency || "", 2)}`);
    setText("out_upside", it.upside != null ? pct(it.upside, 2) : "—");
    setText("pillReady", state.lang === "cz" ? "NAČTENO" : "LOADED");

    showView("model");
    toast(state.lang === "cz" ? "Načteno" : "Loaded");
  }

  function exportCSV() {
    const t = I18N[state.lang];
    const items = loadWatchlist();
    if (!items.length) {
      toast(state.lang === "cz" ? "Watchlist je prázdný." : "Watchlist is empty.");
      return;
    }
    const header = ["date", "ticker", "currency", "base", "bear", "bull", "price", "upside"];
    const rows = items.map((it) => [
      it.date || "",
      it.ticker || it.name || "",
      it.currency || "",
      it.base ?? "",
      it.bear ?? "",
      it.bull ?? "",
      it.price ?? "",
      it.upside ?? "",
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "equity-analyzer-watchlist.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(t.msg.exportReady);
  }

  function clearWatchlist() {
    const t = I18N[state.lang];
    saveWatchlist([]);
    renderWatchlist();
    toast(t.msg.cleared);
  }

  // =========================
  // Demo + Reset
  // =========================
  function demoValues() {
    const t = I18N[state.lang];
    $("in_ticker").value = "AAPL";
    $("in_currency").value = "USD";
    $("in_type").value = "growth";
    $("in_mode").value = "quick";
    $("in_price").value = "180.50";
    $("in_mos").value = "0";
    $("in_method").value = "fcf";
    $("in_years").value = "10";
    $("in_fcf").value = "11000000000";
    $("in_units").value = "raw";
    $("in_shares").value = "15500000000";
    $("in_cash").value = "50000000000";
    $("in_debt").value = "70000000000";
    $("in_disc").value = "9";
    $("in_term").value = "2.5";
    $("in_base").value = "12";
    $("in_spread").value = "2";
    applyTypeDefaults();
    toast(t.msg.demoLoaded);
  }

  function resetAll() {
    $("in_ticker").value = "";
    $("in_price").value = "";
    $("in_years").value = "10";
    $("in_fcf").value = "";
    $("in_shares").value = "";
    $("in_cash").value = "";
    $("in_debt").value = "";
    $("in_disc").value = "9";
    $("in_term").value = "2.5";
    $("in_base").value = "12";
    $("in_spread").value = "2";
    $("in_units").value = "raw";
    $("in_type").value = "growth";
    $("in_mode").value = "quick";
    $("in_mos").value = "0";
    $("in_method").value = "fcf";

    setText("out_base", "—");
    setText("out_range", "—");
    setText("out_upside", "—");
    setText("out_warn", "—");
    setText("pillReady", state.lang === "cz" ? "PŘIPRAVENO" : "READY");
    setText("out_details", I18N[state.lang].detailsEmpty);

    state.lastResult = null;
    toast(state.lang === "cz" ? "Reset hotový" : "Reset done");
  }

  // =========================
  // Utilities
  // =========================
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =========================
  // Init
  // =========================
  function init() {
    // bind tab buttons
    qsa(".tab").forEach((b) => {
      b.addEventListener("click", () => {
        const v = b.getAttribute("data-view");
        if (v === "model") showView("model");
        if (v === "watchlist") {
          renderWatchlist();
          showView("watchlist");
        }
        if (v === "about") showView("about");
      });
    });

    // language buttons
    $("btnEN")?.addEventListener("click", () => setLang("en"));
    $("btnCZ")?.addEventListener("click", () => setLang("cz"));

    // main buttons
    $("btnDemo")?.addEventListener("click", demoValues);
    $("btnCalc")?.addEventListener("click", compute);
    $("btnReset")?.addEventListener("click", resetAll);
    $("btnSave")?.addEventListener("click", saveCurrentToWatchlist);
    $("btnSaveTop")?.addEventListener("click", saveCurrentToWatchlist);

    // watchlist buttons
    $("btnExport")?.addEventListener("click", exportCSV);
    $("btnClearWL")?.addEventListener("click", clearWatchlist);
    $("btnBackFromWL")?.addEventListener("click", () => showView("model"));
    $("btnBackFromAbout")?.addEventListener("click", () => showView("model"));

    // type defaults
    $("in_type")?.addEventListener("change", applyTypeDefaults);

    // mode label update
    $("in_mode")?.addEventListener("change", () => {
      state.mode = readSelect("in_mode") || "quick";
      setText("pillMode", I18N[state.lang].modePill(state.mode));
    });

    // close tip pop on Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideTipPop();
    });

    // initial values
    const savedLang = localStorage.getItem(LS.lang);
    state.lang = savedLang === "cz" ? "cz" : "en";

    // set defaults if empty
    if (!$("in_years")?.value) $("in_years").value = "10";
    if (!$("in_disc")?.value) $("in_disc").value = "9";
    if (!$("in_term")?.value) $("in_term").value = "2.5";
    if (!$("in_base")?.value) $("in_base").value = "12";
    if (!$("in_spread")?.value) $("in_spread").value = "2";

    // render watchlist and set language
    renderWatchlist();
    setLang(state.lang);

    // default view
    showView("model");
    setText("out_details", I18N[state.lang].detailsEmpty);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
renderResearchPromptsSafe((window.state && window.state.lang) ? window.state.lang : "cz");
  const root = document.getElementById("research-prompts-root");
  if (!root) return;

  root.innerHTML = `
    <div class="card" style="margin-top:16px;">
      <h3>${lang === "cz" ? "Research prompty (AI)" : "Research Prompts (AI)"}</h3>
      <ul>
  <li>Analyse business model</li>
  <li>Key risks</li>
  <li>Competitive advantages</li>
  <li>Growth drivers</li>
  <li>Financial red flags</li>
</ul>
    </div>
  `;
}renderResearchPromptsSafe(state.lang);

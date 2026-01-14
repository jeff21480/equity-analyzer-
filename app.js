(() => {
  "use strict";

  // ============================================================
  // Helpers
  // ============================================================
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

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

  // Robust number parse: "1 234,56" | "1,234.56" | "1234.56" | "1234,56"
  function num(v) {
    if (v == null) return NaN;
    let s = String(v).trim();
    if (!s) return NaN;

    // remove spaces
    s = s.replace(/\s+/g, "");

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    // If contains both, assume comma thousands and dot decimal: 1,234.56 -> remove commas
    if (hasComma && hasDot) s = s.replace(/,/g, "");
    // If contains comma but no dot, assume comma decimal: 1234,56 -> replace comma with dot
    else if (hasComma && !hasDot) s = s.replace(/,/g, ".");

    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fmt(n, digits = 2) {
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  function setText(id, text) {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
  }

  function setHTML(id, html) {
    const el = $(id);
    if (!el) return;
    el.innerHTML = html;
  }

  function setPlaceholder(id, text) {
    const el = $(id);
    if (!el) return;
    el.placeholder = text;
  }

  function on(id, ev, fn) {
    const el = $(id);
    if (!el) return;
    el.addEventListener(ev, fn);
  }

  // ============================================================
  // Theme fixes (dropdown contrast + nicer boxes)
  // (injected via JS so you don't have to touch CSS now)
  // ============================================================
  function injectThemeFixCSS() {
    const css = `
      :root{
        --ea-bg:#0b0b16;
        --ea-card:#151530;
        --ea-card2:#12122a;
        --ea-border: rgba(140, 120, 255, .55);
        --ea-border2: rgba(90, 160, 255, .35);
        --ea-glow: rgba(130, 120, 255, .25);
        --ea-text: rgba(255,255,255,.92);
        --ea-muted: rgba(255,255,255,.68);
        --ea-accent:#8f78ff;
        --ea-accent2:#4da3ff;
      }

      /* Fix dropdown contrast on Chrome/Android/Windows */
      select, option, optgroup {
        background-color: #0f1024 !important;
        color: rgba(255,255,255,.92) !important;
      }
      option:hover, option:checked {
        background-color: #1b1d3d !important;
        color: rgba(255,255,255,.95) !important;
      }

      /* If you use custom select wrappers, this still helps */
      select{
        border: 1px solid var(--ea-border) !important;
        box-shadow: 0 0 0 1px rgba(0,0,0,.2), 0 0 18px var(--ea-glow) !important;
        outline: none !important;
      }
      select:focus{
        border-color: rgba(140,120,255,.9) !important;
        box-shadow: 0 0 0 2px rgba(143,120,255,.25), 0 0 22px rgba(77,163,255,.18) !important;
      }

      /* Tooltips / small help blocks (if exist) */
      .help, .hint, .note {
        color: var(--ea-muted) !important;
      }

      /* Make cards/boxes pop more (if your HTML uses .card / .box / .panel) */
      .card, .box, .panel {
        border: 1px solid var(--ea-border) !important;
        box-shadow: 0 0 0 1px rgba(0,0,0,.22), 0 0 26px var(--ea-glow) !important;
      }
    `;
    const st = document.createElement("style");
    st.setAttribute("data-ea-style", "theme-fix");
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ============================================================
  // i18n
  // ============================================================
  const i18n = {
    en: {
      appSubtitle: "DCF fair value • Watchlist • Education",
      demo: "Demo values",
      saveWL: "Save to Watchlist",
      exportCSV: "Export CSV",
      clearAll: "Clear all",
      load: "Load",
      del: "Delete",
      back: "Back",

      tabs: {
        model: "DCF Model",
        watch: "Watchlist",
        about: "About"
      },

      labels: {
        ticker: "Ticker / Name",
        currency: "Currency",
        companyType: "Company type",
        mode: "Mode",
        price: "Current price (optional)",
        mos: "Margin of Safety",
        method: "DCF method",
        years: "Projection (years)",
        fcf: "FCF (TTM or 3–5y avg)",
        units: "Units",
        shares: "Shares (diluted)",
        cash: "Cash (optional)",
        debt: "Debt (optional)",
        disc: "Discount rate (base) %",
        term: "Terminal growth %",
        base: "Base FCF growth %",
        spread: "Quick spread (± pp)"
      },

      hints: {
        ticker: "Used for watchlist label.",
        currency: "All inputs should be in the selected currency.",
        companyType: "Sets reasonable defaults + warnings (you can override).",
        mode: "Quick: enter Base; Bear/Bull are derived (± spread).",
        price: "Used only for upside / margin-of-safety view.",
        mos: "Applied after valuation (to Base) for a conservative target.",
        method: "If you don’t know FCF, estimate it via revenue × margin.",
        years: "Commonly 5–10 years depending on predictability.",
        fcf: "Prefer a 3–5y average for cyclical firms (avoid “one great year”).",
        units: "Optional: you can enter values in millions/billions for comfort.",
        shares: "Used to compute fair value per share.",
        cash: "Added to enterprise value (EV → Equity).",
        debt: "Subtracted to get equity value.",
        disc: "Higher risk → higher discount → lower fair value.",
        term: "Long-run growth after projection. Keep conservative.",
        base: "Annual growth during projection.",
        spread: "Quick mode derives Bear/Base/Bull = Base ± spread."
      },

      toasts: {
        langEN: "Language: English",
        langCZ: "Language: Czech",
        saved: "Saved to Watchlist",
        cleared: "Watchlist cleared",
        calculated: "Calculated",
        demoLoaded: "Demo loaded",
        deleted: "Deleted"
      },

      aboutHTML: `
        <h2>About Equity Analyzer</h2>
        <p>
          Equity Analyzer is an <strong>educational valuation tool</strong> based on a multi-scenario
          Discounted Cash Flow (DCF) model (Bear / Base / Bull).
        </p>

        <h3>Important disclaimer</h3>
        <p>
          This application is <strong>NOT financial advice</strong>. It is for educational and analytical purposes only.
          Outputs depend entirely on your assumptions. Always verify inputs and consider multiple methods.
        </p>

        <h3>How it works (in plain English)</h3>
        <ul>
          <li>You enter <strong>FCF</strong> (Free Cash Flow), a projection horizon (years), growth assumptions, and a discount rate.</li>
          <li>The model projects future FCF and discounts them back to today.</li>
          <li>Then it adds a terminal value (what the business is worth after the projection period).</li>
          <li>If you enter cash/debt, it converts Enterprise Value → Equity Value, and divides by shares to get <strong>fair value per share</strong>.</li>
          <li>Bear/Base/Bull are used to avoid false precision and show a reasonable range.</li>
        </ul>

        <h3>What to enter (practical guidance)</h3>
        <ul>
          <li><strong>FCF:</strong> Use TTM FCF, or for cyclical firms use a <strong>3–5 year average</strong>.</li>
          <li><strong>Discount rate:</strong> Higher risk → higher rate. Large stable firms often lower; small/volatile firms higher.</li>
          <li><strong>Growth:</strong> Keep it conservative. If unsure, use a smaller base growth and wider Bear/Bull spread.</li>
          <li><strong>Terminal growth:</strong> Usually low (often around long-term inflation + modest real growth).</li>
          <li><strong>Shares (diluted):</strong> Prefer diluted shares (includes options/RSUs). This matters a lot.</li>
          <li><strong>Cash / Debt:</strong> Optional, but improves realism if you know the balance sheet values.</li>
        </ul>

        <h3>Best suited for</h3>
        <ul>
          <li>Mature companies</li>
          <li>Blue-chip stocks</li>
          <li>Established growth companies with positive, relatively predictable FCF</li>
        </ul>

        <h3>Less suitable for</h3>
        <ul>
          <li>Pre-revenue startups</li>
          <li>Highly cyclical or turnaround businesses (use normalized/average FCF)</li>
          <li>Companies with unstable or negative FCF</li>
        </ul>
      `
    },

    cz: {
      appSubtitle: "DCF férová hodnota • Watchlist • Vysvětlení",
      demo: "Demo hodnoty",
      saveWL: "Uložit do Watchlistu",
      exportCSV: "Export CSV",
      clearAll: "Smazat vše",
      load: "Load",
      del: "Delete",
      back: "Zpět",

      tabs: {
        model: "DCF Model",
        watch: "Watchlist",
        about: "O aplikaci"
      },

      labels: {
        ticker: "Ticker / Název",
        currency: "Měna",
        companyType: "Typ firmy",
        mode: "Režim",
        price: "Aktuální cena (volitelně)",
        mos: "Margin of Safety",
        method: "DCF metoda",
        years: "Projekce (roky)",
        fcf: "FCF (TTM nebo 3–5 let průměr)",
        units: "Jednotky",
        shares: "Akcie (diluted)",
        cash: "Cash (volitelně)",
        debt: "Dluh (volitelně)",
        disc: "Diskontní sazba (base) %",
        term: "Terminální růst %",
        base: "Růst FCF (Base) %",
        spread: "Quick rozptyl (± pp)"
      },

      hints: {
        ticker: "Použije se jako název ve Watchlistu.",
        currency: "Všechny vstupy drž v zvolené měně.",
        companyType: "Nastaví rozumné defaulty + upozornění (můžeš přepsat).",
        mode: "Quick: zadáš Base; Bear/Bull se dopočítají (± rozptyl).",
        price: "Pouze pro výpočet upside / margin-of-safety.",
        mos: "Aplikuje se po výpočtu (na Base) pro konzervativní cílovou cenu.",
        method: "Když neznáš FCF, můžeš ho odhadnout přes tržby × marže.",
        years: "Běžně 5–10 let podle předvídatelnosti.",
        fcf: "U cyklických firem raději 3–5 let průměr (ne „jeden skvělý rok“).",
        units: "Volitelně: můžeš zadávat hodnoty v milionech/miliardách pro pohodlí.",
        shares: "Použije se pro výpočet férové hodnoty na akcii.",
        cash: "Přičítá se k EV (EV → Equity).",
        debt: "Odečítá se pro výpočet Equity value.",
        disc: "Vyšší riziko → vyšší diskont → nižší férová hodnota.",
        term: "Dlouhodobý růst po projekci. Drž konzervativně.",
        base: "Roční růst během projekce.",
        spread: "Quick režim: Bear/Base/Bull = Base ± rozptyl."
      },

      toasts: {
        langEN: "Jazyk: angličtina",
        langCZ: "Jazyk: čeština",
        saved: "Uloženo do Watchlistu",
        cleared: "Watchlist smazán",
        calculated: "Spočítáno",
        demoLoaded: "Demo načteno",
        deleted: "Smazáno"
      },

      aboutHTML: `
        <h2>O aplikaci Equity Analyzer</h2>
        <p>
          Equity Analyzer je <strong>vzdělávací valuací nástroj</strong> postavený na multi-scenario
          DCF modelu (Bear / Base / Bull).
        </p>

        <h3>Důležité upozornění</h3>
        <p>
          Tato aplikace <strong>NENÍ finanční poradenství</strong>. Slouží pouze pro vzdělávací a analytické účely.
          Výstupy závisejí výhradně na tvých předpokladech. Vždy ověř data a používej více metod.
        </p>

        <h3>Jak to funguje (srozumitelně)</h3>
        <ul>
          <li>Zadáš <strong>FCF</strong> (Free Cash Flow), délku projekce, růstové předpoklady a diskontní sazbu.</li>
          <li>Model promítne budoucí FCF a zdiskontuje je do současnosti.</li>
          <li>Přidá terminální hodnotu (co firma „stojí“ po konci projekce).</li>
          <li>Pokud zadáš cash/dluh, převede Enterprise Value → Equity Value a vydělí akciemi na <strong>férovou cenu na akcii</strong>.</li>
          <li>Bear/Base/Bull slouží proti falešné přesnosti a ukáže rozumné rozpětí.</li>
        </ul>

        <h3>Jak správně nastavovat vstupy (praktický návod)</h3>
        <ul>
          <li><strong>FCF:</strong> Použij TTM FCF; u cyklických firem raději <strong>3–5 let průměr</strong>.</li>
          <li><strong>Diskont:</strong> Čím vyšší riziko, tím vyšší diskont. Stabilní velké firmy často nižší, rizikovější vyšší.</li>
          <li><strong>Růst:</strong> Drž konzervativně. Když si nejsi jistý, dej menší Base a širší Bear/Bull rozpětí.</li>
          <li><strong>Terminální růst:</strong> Většinou nízký (často okolo dlouhodobé inflace + malý reálný růst).</li>
          <li><strong>Akcie (diluted):</strong> Preferuj diluted (včetně opcí/RSU). Umí výrazně změnit výsledky.</li>
          <li><strong>Cash / Dluh:</strong> Volitelné, ale zlepší realističnost, pokud hodnoty znáš z rozvahy.</li>
        </ul>

        <h3>Hodí se pro</h3>
        <ul>
          <li>Zralé firmy</li>
          <li>Blue-chip akcie</li>
          <li>Ustálené růstové firmy s pozitivním a relativně předvídatelným FCF</li>
        </ul>

        <h3>Méně vhodné pro</h3>
        <ul>
          <li>Pre-revenue startupy</li>
          <li>Silně cyklické/turnaround firmy (použij normalizované/průměrné FCF)</li>
          <li>Firmy s nestabilním nebo záporným FCF</li>
        </ul>
      `
    }
  };

  const state = {
    lang: "en",
    view: "model",
    // watchlist stored in localStorage
  };

  function loadState() {
    const l = localStorage.getItem("ea_lang");
    if (l === "cz" || l === "en") state.lang = l;
    const v = localStorage.getItem("ea_view");
    if (v === "model" || v === "watch" || v === "about") state.view = v;
  }

  function saveState() {
    localStorage.setItem("ea_lang", state.lang);
    localStorage.setItem("ea_view", state.view);
  }

  // ============================================================
  // Language application
  // - We translate known IDs + also generic data-i18n attributes.
  // ============================================================
  function applyLang(lang) {
    state.lang = (lang === "cz") ? "cz" : "en";
    saveState();

    const t = i18n[state.lang];

    // Header / buttons (if IDs exist)
    setText("heroSub", t.appSubtitle);
    setText("btnDemo", t.demo);
    setText("btnSaveTop", t.saveWL);
    setText("btnExport", t.exportCSV);
    setText("btnClearWL", t.clearAll);

    // Tabs
    setText("tabModel", t.tabs.model);
    setText("tabWatch", t.tabs.watch);
    setText("tabAbout", t.tabs.about);

    // Labels (common IDs – safe if missing)
    setText("lbl_ticker", t.labels.ticker);
    setText("lbl_currency", t.labels.currency);
    setText("lbl_type", t.labels.companyType);
    setText("lbl_mode", t.labels.mode);
    setText("lbl_price", t.labels.price);
    setText("lbl_mos", t.labels.mos);
    setText("lbl_method", t.labels.method);
    setText("lbl_years", t.labels.years);
    setText("lbl_fcf", t.labels.fcf);
    setText("lbl_units", t.labels.units);
    setText("lbl_shares", t.labels.shares);
    setText("lbl_cash", t.labels.cash);
    setText("lbl_debt", t.labels.debt);
    setText("lbl_disc", t.labels.disc);
    setText("lbl_term", t.labels.term);
    setText("lbl_base", t.labels.base);
    setText("lbl_spread", t.labels.spread);

    // Hints (common IDs)
    setText("hint_ticker", t.hints.ticker);
    setText("hint_currency", t.hints.currency);
    setText("hint_type", t.hints.companyType);
    setText("hint_mode", t.hints.mode);
    setText("hint_price", t.hints.price);
    setText("hint_mos", t.hints.mos);
    setText("hint_method", t.hints.method);
    setText("hint_years", t.hints.years);
    setText("hint_fcf", t.hints.fcf);
    setText("hint_units", t.hints.units);
    setText("hint_shares", t.hints.shares);
    setText("hint_cash", t.hints.cash);
    setText("hint_debt", t.hints.debt);
    setText("hint_disc", t.hints.disc);
    setText("hint_term", t.hints.term);
    setText("hint_base", t.hints.base);
    setText("hint_spread", t.hints.spread);

    // Placeholders (safe if missing)
    setPlaceholder("in_ticker", state.lang === "cz" ? "např. AAPL / SOFI / PLTR" : "e.g., AAPL / SOFI / PLTR");

    // About content
    setHTML("aboutBody", t.aboutHTML);

    // Generic translator (if you add these later in HTML)
    qsa("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = key.split(".").reduce((acc, k) => acc && acc[k], t);
      if (typeof val === "string") el.textContent = val;
    });
    qsa("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      const val = key.split(".").reduce((acc, k) => acc && acc[k], t);
      if (typeof val === "string") el.placeholder = val;
    });

    // Button active state (optional)
    const bEN = $("btnLangEN");
    const bCZ = $("btnLangCZ");
    if (bEN && bCZ) {
      bEN.classList.toggle("active", state.lang === "en");
      bCZ.classList.toggle("active", state.lang === "cz");
    }

    toast(state.lang === "cz" ? t.toasts.langCZ : t.toasts.langEN);
  }

  // ============================================================
  // Views / tabs
  // ============================================================
  function showView(name) {
    const views = ["model", "watch", "about"];
    if (!views.includes(name)) name = "model";
    state.view = name;
    saveState();

    const map = {
      model: "viewModel",
      watch: "viewWatch",
      about: "viewAbout"
    };

    views.forEach(v => {
      const sec = $(map[v]);
      if (sec) sec.classList.toggle("hidden", v !== name);
    });

    // tab active (if tabs exist)
    const tabMap = { model: "tabModel", watch: "tabWatch", about: "tabAbout" };
    views.forEach(v => {
      const el = $(tabMap[v]);
      if (el) el.classList.toggle("active", v === name);
    });
  }

  // ============================================================
  // Watchlist (localStorage)
  // ============================================================
  const WL_KEY = "ea_watchlist_v1";

  function loadWL() {
    try {
      const raw = localStorage.getItem(WL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveWL(arr) {
    localStorage.setItem(WL_KEY, JSON.stringify(arr || []));
  }

  function renderWL() {
    const wrap = $("wlBody");
    if (!wrap) return;

    const arr = loadWL();
    if (!arr.length) {
      wrap.innerHTML = `<div class="hint">${state.lang === "cz"
        ? "Zatím nemáš uložené žádné výpočty."
        : "No saved results yet."}</div>`;
      return;
    }

    // Build table-like rows (simple, safe)
    const head = `
      <div class="wlRow wlHead">
        <div>${state.lang === "cz" ? "Název" : "Name"}</div>
        <div>${state.lang === "cz" ? "Base" : "Base"}</div>
        <div>${state.lang === "cz" ? "Rozpětí" : "Range"}</div>
        <div>${state.lang === "cz" ? "Cena" : "Price"}</div>
        <div>${state.lang === "cz" ? "Upside" : "Upside"}</div>
        <div>${state.lang === "cz" ? "Akce" : "Action"}</div>
      </div>
    `;

    const rows = arr.map((x, idx) => {
      const base = Number.isFinite(x.base) ? `${fmt(x.base)} ${x.ccy || ""}` : "—";
      const range = (Number.isFinite(x.bear) && Number.isFinite(x.bull))
        ? `${fmt(x.bear)} → ${fmt(x.bull)} ${x.ccy || ""}`
        : "—";
      const price = Number.isFinite(x.price) ? `${fmt(x.price)} ${x.ccy || ""}` : "—";
      const up = Number.isFinite(x.upside) ? `${fmt(x.upside, 2)}%` : "—";
      const d = x.date || "";
      const name = (x.name || "").toUpperCase();

      return `
        <div class="wlRow">
          <div><strong>${name}</strong><div class="wlSub">${d}</div></div>
          <div>${base}</div>
          <div>${range}</div>
          <div>${price}</div>
          <div>${up}</div>
          <div class="wlBtns">
            <button class="btn sm" data-wl-load="${idx}">${state.lang === "cz" ? "Load" : "Load"}</button>
            <button class="btn sm ghost" data-wl-del="${idx}">${state.lang === "cz" ? "Delete" : "Delete"}</button>
          </div>
        </div>
      `;
    }).join("");

    wrap.innerHTML = head + rows;

    // bind actions
    qsa("[data-wl-load]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-wl-load"));
        const arr = loadWL();
        const x = arr[idx];
        if (!x) return;
        // Restore inputs if exist
        if ($("in_ticker")) $("in_ticker").value = x.name || "";
        if ($("in_price")) $("in_price").value = Number.isFinite(x.price) ? String(x.price) : "";
        if ($("in_fcf")) $("in_fcf").value = Number.isFinite(x.fcf) ? String(x.fcf) : "";
        if ($("in_years")) $("in_years").value = Number.isFinite(x.years) ? String(x.years) : "";
        if ($("in_disc")) $("in_disc").value = Number.isFinite(x.disc) ? String(x.disc) : "";
        if ($("in_term")) $("in_term").value = Number.isFinite(x.term) ? String(x.term) : "";
        if ($("in_base")) $("in_base").value = Number.isFinite(x.baseG) ? String(x.baseG) : "";
        if ($("in_spread")) $("in_spread").value = Number.isFinite(x.spread) ? String(x.spread) : "";
        if ($("in_shares")) $("in_shares").value = Number.isFinite(x.shares) ? String(x.shares) : "";
        if ($("in_cash")) $("in_cash").value = Number.isFinite(x.cash) ? String(x.cash) : "";
        if ($("in_debt")) $("in_debt").value = Number.isFinite(x.debt) ? String(x.debt) : "";

        if ($("in_ccy")) $("in_ccy").value = x.ccy || $("in_ccy").value;
        if ($("in_type")) $("in_type").value = x.type || $("in_type").value;
        if ($("in_mode")) $("in_mode").value = x.mode || $("in_mode").value;
        if ($("in_method")) $("in_method").value = x.method || $("in_method").value;

        showView("model");
        toast(i18n[state.lang].toasts.calculated);
      });
    });

    qsa("[data-wl-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-wl-del"));
        const arr = loadWL();
        if (!arr[idx]) return;
        arr.splice(idx, 1);
        saveWL(arr);
        renderWL();
        toast(i18n[state.lang].toasts.deleted);
      });
    });
  }

  // ============================================================
  // DCF compute (simple multi-scenario based on Base + spread)
  // ============================================================
  function computeDCF() {
    const lang = state.lang;
    const t = i18n[lang];

    const name = ($("in_ticker")?.value || "").trim() || "—";
    const ccy = $("in_ccy")?.value || "USD";
    const years = Math.round(num($("in_years")?.value));
    const disc = num($("in_disc")?.value) / 100;
    const term = num($("in_term")?.value) / 100;
    const baseG = num($("in_base")?.value) / 100;
    const spread = num($("in_spread")?.value) / 100;

    const fcf = num($("in_fcf")?.value);
    const shares = num($("in_shares")?.value);
    const cash = num($("in_cash")?.value);
    const debt = num($("in_debt")?.value);
    const price = num($("in_price")?.value);

    // Basic validation (soft)
    if (!Number.isFinite(fcf) || fcf <= 0) {
      toast(lang === "cz" ? "Zadej FCF > 0" : "Enter FCF > 0");
      return;
    }
    if (!Number.isFinite(years) || years < 1 || years > 40) {
      toast(lang === "cz" ? "Zadej roky projekce (1–40)" : "Enter projection years (1–40)");
      return;
    }
    if (!Number.isFinite(disc) || disc <= 0 || disc > 0.5) {
      toast(lang === "cz" ? "Zadej rozumný diskont (např. 6–20%)" : "Enter a reasonable discount (e.g., 6–20%)");
      return;
    }
    if (!Number.isFinite(term) || term < -0.02 || term > 0.08) {
      toast(lang === "cz" ? "Terminální růst bývá nízký (např. 0–4%)" : "Terminal growth is usually low (e.g., 0–4%)");
      // not blocking
    }
    if (!Number.isFinite(shares) || shares <= 0) {
      toast(lang === "cz" ? "Zadej počet akcií (diluted) > 0" : "Enter diluted shares > 0");
      return;
    }

    const scenarios = [
      { key: "bear", g: baseG - spread },
      { key: "base", g: baseG },
      { key: "bull", g: baseG + spread }
    ];

    function dcfPerShare(g) {
      // Project FCF with constant growth
      let pv = 0;
      let f = fcf;
      for (let y = 1; y <= years; y++) {
        f = f * (1 + g);
        pv += f / Math.pow(1 + disc, y);
      }

      // Terminal value using Gordon Growth on final year FCF
      const fN = f; // already grown to year N
      const tvDen = disc - term;
      const tv = (tvDen > 0.0001) ? (fN * (1 + term)) / tvDen : NaN;
      const pvTV = Number.isFinite(tv) ? tv / Math.pow(1 + disc, years) : NaN;

      let equity = pv + (Number.isFinite(pvTV) ? pvTV : 0);

      // EV -> Equity adjust
      if (Number.isFinite(cash)) equity += cash;
      if (Number.isFinite(debt)) equity -= debt;

      return equity / shares;
    }

    const out = {};
    scenarios.forEach(s => out[s.key] = dcfPerShare(s.g));

    // Outputs
    setText("out_base", `${fmt(out.base)} ${ccy}`);
    setText("out_range", `${fmt(out.bear)} → ${fmt(out.bull)} ${ccy}`);

    // Upside
    if (Number.isFinite(price) && price > 0 && Number.isFinite(out.base)) {
      const up = ((out.base / price) - 1) * 100;
      setText("out_upside", `${fmt(up, 2)}%`);
    } else {
      setText("out_upside", lang === "cz" ? "Potřebuje aktuální cenu (volitelně)." : "Needs current price (optional).");
    }

    // Small warnings/checks
    const warns = [];
    if (baseG > 0.25) warns.push(lang === "cz" ? "Base růst je velmi vysoký – zvaž konzervativnější." : "Base growth is very high – consider being more conservative.");
    if (term > 0.04) warns.push(lang === "cz" ? "Terminální růst je vysoký – běžně bývá nízký." : "Terminal growth is high – it is usually low.");
    if (disc < 0.06) warns.push(lang === "cz" ? "Nízký diskont – pro rizikové firmy bývá vyšší." : "Low discount rate – riskier firms usually require higher.");
    if (disc <= term) warns.push(lang === "cz" ? "Pozor: diskont musí být > terminální růst." : "Warning: discount rate must be > terminal growth.");

    setText("out_warn", warns.length ? warns.join(" • ") : "—");

    toast(t.toasts.calculated);
  }

  function saveCurrentToWL() {
    const lang = state.lang;
    const t = i18n[lang];

    const name = ($("in_ticker")?.value || "").trim();
    if (!name) {
      toast(lang === "cz" ? "Zadej ticker/název." : "Enter ticker/name.");
      return;
    }

    const ccy = $("in_ccy")?.value || "USD";
    const years = Math.round(num($("in_years")?.value));
    const disc = num($("in_disc")?.value);
    const term = num($("in_term")?.value);
    const baseG = num($("in_base")?.value);
    const spread = num($("in_spread")?.value);
    const fcf = num($("in_fcf")?.value);
    const shares = num($("in_shares")?.value);
    const cash = num($("in_cash")?.value);
    const debt = num($("in_debt")?.value);
    const price = num($("in_price")?.value);
    const type = $("in_type")?.value || "";
    const mode = $("in_mode")?.value || "";
    const method = $("in_method")?.value || "";

    // parse outputs if exist
    const baseText = $("out_base")?.textContent || "";
    const rangeText = $("out_range")?.textContent || "";
    const base = num(baseText);
    // range parse is hard; ignore if fails
    const m = rangeText.match(/(-?[\d\s.,]+)\s*→\s*(-?[\d\s.,]+)/);
    const bear = m ? num(m[1]) : NaN;
    const bull = m ? num(m[2]) : NaN;

    const upText = $("out_upside")?.textContent || "";
    const upside = num(upText);

    const arr = loadWL();
    arr.unshift({
      name: name.toUpperCase(),
      date: new Date().toISOString().slice(0, 10),
      ccy,
      years,
      disc,
      term,
      baseG,
      spread,
      fcf,
      shares,
      cash,
      debt,
      price,
      type,
      mode,
      method,
      base,
      bear,
      bull,
      upside
    });
    saveWL(arr);
    renderWL();
    toast(t.toasts.saved);
  }

  function clearWL() {
    saveWL([]);
    renderWL();
    toast(i18n[state.lang].toasts.cleared);
  }

  function demo() {
    // demo values that look realistic for AAPL-ish
    if ($("in_ticker")) $("in_ticker").value = "AAPL";
    if ($("in_ccy")) $("in_ccy").value = "USD";
    if ($("in_type")) $("in_type").value = $("in_type").value || "mature";
    if ($("in_mode")) $("in_mode").value = $("in_mode").value || "quick";
    if ($("in_method")) $("in_method").value = $("in_method").value || "fcf";

    if ($("in_price")) $("in_price").value = "180.50";
    if ($("in_years")) $("in_years").value = "10";
    if ($("in_fcf")) $("in_fcf").value = "110000000000";
    if ($("in_shares")) $("in_shares").value = "15500000000";
    if ($("in_cash")) $("in_cash").value = "50000000000";
    if ($("in_debt")) $("in_debt").value = "70000000000";
    if ($("in_disc")) $("in_disc").value = "9";
    if ($("in_term")) $("in_term").value = "2.5";
    if ($("in_base")) $("in_base").value = "12";
    if ($("in_spread")) $("in_spread").value = "2";

    toast(i18n[state.lang].toasts.demoLoaded);
  }

  // ============================================================
  // Init
  // ============================================================
  function init() {
    injectThemeFixCSS();
    loadState();

    // Bind language buttons (IMPORTANT: do not remove listeners on re-render)
    on("btnLangEN", "click", () => applyLang("en"));
    on("btnLangCZ", "click", () => applyLang("cz"));

    // Bind tabs
    on("tabModel", "click", () => showView("model"));
    on("tabWatch", "click", () => { showView("watch"); renderWL(); });
    on("tabAbout", "click", () => showView("about"));

    // Back buttons inside cards (if exist)
    // In your HTML you used onclick="showView('model')" before – we provide global fallback:
    window.showView = (v) => showView(v);

    // Buttons
    on("btnCalc", "click", computeDCF);
    on("btnDemo", "click", demo);
    on("btnSave", "click", saveCurrentToWL);
    on("btnSaveTop", "click", saveCurrentToWL);
    on("btnClearWL", "click", clearWL);

    // Export CSV (optional if you already have UI)
    on("btnExport", "click", () => {
      const arr = loadWL();
      if (!arr.length) {
        toast(state.lang === "cz" ? "Watchlist je prázdný." : "Watchlist is empty.");
        return;
      }
      const header = ["date","name","ccy","base","bear","bull","price","upside","years","disc","term","baseG","spread","fcf","shares","cash","debt","type","mode","method"];
      const lines = [header.join(",")].concat(arr.map(x => header.map(k => {
        const v = x[k];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      }).join(",")));

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "equity_analyzer_watchlist.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    // Apply language + view
    applyLang(state.lang);
    showView(state.view);

    // Render WL if currently on watch view
    if (state.view === "watch") renderWL();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

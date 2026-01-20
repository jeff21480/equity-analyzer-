import React, { useMemo, useState } from "react";

/**
 * OCEKAVANE:
 * - lang: "cz" | "en"  (napoj na tvuj globalni jazykovy prepinac)
 * - companyName, ticker (volitelne; pokud nemas, nech prazdne)
 */

const COPY_LABEL = {
  cz: "Kopírovat prompt",
  en: "Copy prompt"
};

const COPY_ALL_LABEL = {
  cz: "Kopírovat vše",
  en: "Copy all"
};

const COPIED_LABEL = {
  cz: "Zkopírováno ✅",
  en: "Copied ✅"
};

const HEADER = {
  cz: {
    title: "Research prompty (Buy-side analýza)",
    subtitle:
      "5 připravených promptů pro rychlou a systematickou analýzu firmy. Doplň název/ticker a vlož do ChatGPT."
  },
  en: {
    title: "Research Prompts (Buy-side analysis)",
    subtitle:
      "5 ready-to-use prompts for fast, structured equity research. Add company/ticker and paste into ChatGPT."
  }
};

const PROMPTS = {
  cz: [
    {
      id: "p1",
      title: "1) Buy-side analýza business modelu",
      desc: "Vysvětlí, jak firma vydělává peníze, co prodává, komu a proti komu stojí.",
      text: `Působ jako buy-side equity analytik. Zanalyzuj společnost [Company Name] ([Ticker]) a vysvětli:

– Jak funguje její hlavní business model (jednoduše, lidsky)
– Hlavní produkty / služby
– Zákaznické segmenty
– Klíčové geografické trhy
– Hlavní konkurenty a čím se tato firma liší

Napiš to stručně, ale konkrétně, jako interní research note.`
    },
    {
      id: "p2",
      title: "2) V jaké růstové fázi je firma",
      desc: "Zařadí firmu do růstové fáze a zdůvodní to metrikami + alokací kapitálu.",
      text: `Urči, v jaké růstové fázi je společnost [Company Name] (early growth, scaling, mature compounder nebo ex-growth/cash cow).

Své tvrzení zdůvodni pomocí:

– 3–5letého růstu tržeb a EPS
– Trendů free cash flow
– Čisté hotovosti nebo čistého dluhu
– Dividend, buybacků a reinvestic (R&D / capex)

Popiš, jak management alokuje kapitál a zda to odpovídá dané fázi.`
    },
    {
      id: "p3",
      title: "3) Finanční kvalita (5–10 let)",
      desc: "Shrne kvalitu byznysu v čase a dá skóre 1–10 pro klíčové oblasti.",
      text: `Shrň finanční kvalitu společnosti [Company Name] za posledních 5–10 let. Zaměř se na:

– CAGR tržeb
– Trend provozní marže
– Free cash flow na akcii
– ROIC a ROE vs jejich trend
– Náklady kapitálu (WACC)
– Sílu rozvahy (zadlužení, úrokové krytí)

Poté dej známku 1–10 pro růst, ziskovost, rozvahu a konzistenci. Každé známce přidej 1–2 věty vysvětlení.`
    },
    {
      id: "p4",
      title: "4) Růstové katalyzátory a rizika",
      desc: "Vypíše hlavní růstové drivere a rizika včetně dopadu a metrik ke sledování.",
      text: `Vyjmenuj 3–5 hlavních růstových driverů společnosti [Company Name] pro následující 3–5 roky a 3–5 největších rizik.

U každého driveru i rizika uveď:

– Dopad (Low / Medium / High)
– Pravděpodobnost (Low / Medium / High)
– Hlavní ukazatele, které by měl investor sledovat (metriky, zprávy, data v odvětví)

Na závěr napiš krátký odstavec:
Co by se muselo povést, aby byla firma víceroletý vítěz?
A co by mě přimělo akcii prodat?`
    },
    {
      id: "p5",
      title: "5) Ocenění + scénáře bull / base / bear",
      desc: "Porovná valuaci s historií/konkurencí a vytvoří scénáře na 3 roky.",
      text: `Zhodnoť ocenění společnosti [Company Name] ([Ticker]) dnes.

Porovnej P/E, EV/EBITDA, P/S a P/B s:
1. jejím 5–10letým průměrem
2. 3–5 nejbližšími konkurenty

Vysvětli, zda současné násobky znamenají optimismus, pesimismus nebo jsou v souladu s historií.

Postav jednoduchý 3letý bear / base / bull scénář s růstem tržeb, maržemi a výslednou hodnotou akcie.

Závěrem napiš, zda risk/reward vypadá atraktivně, neutrálně nebo slabě pro dlouhodobého investora.`
    }
  ],
  en: [
    {
      id: "p1",
      title: "1) Buy-side business model note",
      desc: "Explains how the company makes money: products, customers, geographies, competitors.",
      text: `Act as a buy-side equity analyst. Analyze [Company Name] ([Ticker]) and explain:

– How the core business model works (simple, human)
– Main products / services
– Customer segments
– Key geographic markets
– Main competitors and what differentiates the company

Write it concise but specific, like an internal research note.`
    },
    {
      id: "p2",
      title: "2) What growth stage is the company in?",
      desc: "Classifies the company (early growth / scaling / mature compounder / cash cow) and justifies it with metrics.",
      text: `Determine which growth stage [Company Name] is in (early growth, scaling, mature compounder, or ex-growth/cash cow).

Justify your view using:

– 3–5 year revenue and EPS growth
– Free cash flow trends
– Net cash vs net debt
– Dividends, buybacks, and reinvestment (R&D / capex)

Explain management’s capital allocation and whether it fits the stage.`
    },
    {
      id: "p3",
      title: "3) Financial quality (5–10 years)",
      desc: "Scores growth, profitability, balance sheet strength, and consistency over time.",
      text: `Summarize the financial quality of [Company Name] over the last 5–10 years. Focus on:

– Revenue CAGR
– Operating margin trend
– Free cash flow per share
– ROIC and ROE (and trends)
– Cost of capital (WACC)
– Balance sheet strength (leverage, interest coverage)

Then rate 1–10 for growth, profitability, balance sheet, and consistency. Add 1–2 sentences of reasoning for each.`
    },
    {
      id: "p4",
      title: "4) Growth drivers and risks",
      desc: "Lists key 3–5 year drivers and top risks with impact, probability, and what to track.",
      text: `List 3–5 key growth drivers for [Company Name] over the next 3–5 years and 3–5 biggest risks.

For each driver and risk include:
– Impact (Low / Medium / High)
– Probability (Low / Medium / High)
– Key indicators investors should track (metrics, reports, industry data)

Finish with:
What must go right for this to be a multi-year winner?
What would make you sell the stock?`
    },
    {
      id: "p5",
      title: "5) Valuation + bull/base/bear scenarios",
      desc: "Compares multiples vs history/peers and builds a simple 3-year scenario framework.",
      text: `Assess the valuation of [Company Name] ([Ticker]) today.

Compare P/E, EV/EBITDA, P/S, and P/B versus:
1) its 5–10 year average
2) 3–5 closest peers

Explain whether current multiples imply optimism, pessimism, or align with history.

Build a simple 3-year bear/base/bull scenario (revenue growth, margins, implied value per share).

Conclude whether risk/reward looks attractive, neutral, or weak for a long-term investor.`
    }
  ]
};

function fillPlaceholders(text, companyName, ticker) {
  const cn = companyName?.trim() || "[Company Name]";
  const tk = ticker?.trim() || "[Ticker]";
  return text.replaceAll("[Company Name]", cn).replaceAll("[Ticker]", tk);
}

export default function ResearchPromptsDrawer({
  lang = "cz",
  companyName = "",
  ticker = ""
}) {
  const [openId, setOpenId] = useState("p1");
  const [copiedId, setCopiedId] = useState(null);

  const items = useMemo(() => {
    const list = PROMPTS[lang] || PROMPTS.cz;
    return list.map((p) => ({
      ...p,
      filled: fillPlaceholders(p.text, companyName, ticker)
    }));
  }, [lang, companyName, ticker]);

  async function copy(text, id) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1100);
  }

  async function copyAll() {
    const all = items.map((p) => `${p.title}\n\n${p.filled}`).join("\n\n---\n\n");
    await copy(all, "all");
  }

  const header = HEADER[lang] || HEADER.cz;

  return (
    <section className="card section" id="research-prompts">
      {/* Šuplík hlavička */}
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="h2" style={{ fontWeight: 800, fontSize: 22 }}>{header.title}</div>
          <div style={{ opacity: 0.85, marginTop: 6 }}>{header.subtitle}</div>
        </div>

        <button
          type="button"
          className="btn secondary"
          onClick={copyAll}
          style={{ alignSelf: "flex-start" }}
        >
          {copiedId === "all" ? (COPIED_LABEL[lang] || COPIED_LABEL.cz) : (COPY_ALL_LABEL[lang] || COPY_ALL_LABEL.cz)}
        </button>
      </div>

      {/* 5 prompty uvnitř */}
      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {items.map((p) => {
          const isOpen = openId === p.id;
          return (
            <div
              key={p.id}
              className="card inner"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.03)"
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? "" : p.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  <div style={{ opacity: 0.8, marginTop: 4 }}>{p.desc}</div>
                </div>
                <div style={{ opacity: 0.7, fontSize: 18, lineHeight: "20px" }}>
                  {isOpen ? "–" : "+"}
                </div>
              </button>

              {isOpen && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    className="input textarea"
                    rows={Math.min(16, Math.max(10, p.filled.split("\n").length + 2))}
                    value={p.filled}
                    readOnly
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />

                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => copy(p.filled, p.id)}
                    >
                      {copiedId === p.id ? (COPIED_LABEL[lang] || COPIED_LABEL.cz) : (COPY_LABEL[lang] || COPY_LABEL.cz)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

(() => {
  "use strict";

  // ===== helpers =====
  const $ = (id) => document.getElementById(id);

  function toast(msg) {
    const t = $("toast");
    if (!t) return;
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => (t.style.display = "none"), 2400);
  }

  function num(v) {
    if (v == null) return NaN;
    let s = String(v).trim().replace(/\s+/g, "");
    if (s.includes(",") && !s.includes(".")) s = s.replace(",", ".");
    if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fmt(n) {
    return Number.isFinite(n)
      ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "—";
  }

  // ===== navigation =====
  window.showView = function (v) {
    ["viewModel", "viewWatch", "viewAbout"].forEach(id => {
      const el = $(id);
      if (el) el.classList.add("hidden");
    });
    const map = { model: "viewModel", watch: "viewWatch", about: "viewAbout" };
    const tgt = $(map[v]);
    if (tgt) tgt.classList.remove("hidden");
  };

  // ===== DCF =====
  function pv(fcf, g, r, years) {
    let s = 0;
    for (let t = 1; t <= years; t++) {
      s += (fcf * Math.pow(1 + g, t)) / Math.pow(1 + r, t);
    }
    return s;
  }

  function compute() {
    const fcf = num($("in_fcf")?.value);
    const shares = num($("in_shares")?.value);
    const years = num($("in_years")?.value || 10);
    const g = num($("in_base")?.value) / 100;
    const r = num($("in_disc")?.value) / 100;
    const gT = num($("in_term")?.value) / 100;

    if (!fcf || !shares) {
      toast("Missing inputs");
      return;
    }

    const pvCF = pv(fcf, g, r, years);
    const fcfN = fcf * Math.pow(1 + g, years);
    const tv = (fcfN * (1 + gT)) / (r - gT);
    const pvTV = tv / Math.pow(1 + r, years);

    const equity = pvCF + pvTV;
    const perShare = equity / shares;

    $("out_base").textContent = fmt(perShare) + " USD";
    $("out_range").textContent =
      fmt(perShare * 0.8) + " → " + fmt(perShare * 1.2) + " USD";

    toast("Calculated");
  }

  // ===== buttons =====
  document.addEventListener("DOMContentLoaded", () => {
    $("btnCalc")?.addEventListener("click", compute);
    $("btnDemo")?.addEventListener("click", () => {
      $("in_fcf").value = "110000000000";
      $("in_shares").value = "15500000000";
      $("in_years").value = "10";
      $("in_disc").value = "9";
      $("in_term").value = "2.5";
      $("in_base").value = "12";
      toast("Demo loaded");
    });

    showView("model");
  });
})();

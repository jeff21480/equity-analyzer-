// Jednoduchý „fake“ výpočet férové ceny – jen pro demo.
// Později to vyměníme za opravdový model nebo napojení na API / robota.

function fakeFairValueFromTicker(ticker) {
  const t = ticker.trim().toUpperCase();
  if (!t) return null;

  // jednoduchý deterministický výpočet z písmen tickeru
  let sum = 0;
  for (let i = 0; i < t.length; i++) {
    sum += t.charCodeAt(i);
  }

  const fair = 40 + (sum % 160); // rozsah cca 40–200
  return fair.toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("ticker-input");
  const button = document.getElementById("calculate-btn");
  const resultBox = document.getElementById("result-box");
  const resultText = document.getElementById("result-text");

  function handleCalculate() {
    const ticker = input.value.trim();

    if (!ticker) {
      resultText.textContent = "Zadej prosím ticker akcie (např. AAPL).";
      resultBox.classList.remove("hidden");
      return;
    }

    const fair = fakeFairValueFromTicker(ticker);

    if (fair === null) {
      resultText.textContent = "Něco se pokazilo, zkus to prosím znovu.";
      resultBox.classList.remove("hidden");
      return;
    }

    resultText.textContent =
      `Ukázkový odhad férové ceny pro ` +
      `${ticker.toUpperCase()} je přibližně ${fair} USD na akcii.`;
    resultBox.classList.remove("hidden");
  }

  button.addEventListener("click", handleCalculate);

  // Enter v inputu
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      handleCalculate();
    }
  });
});

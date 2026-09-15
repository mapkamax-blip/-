const params = new URLSearchParams(location.search);

let card = {};
try {
  card = JSON.parse(decodeURIComponent(params.get("data") || "{}"));
} catch (e) {
  card = {};
}

const stats = card.stats || {};
const traits = Array.isArray(card.traits) ? card.traits : [];

const app = document.querySelector("#app");
app.innerHTML = `
  <div class="card">
    <h1>${escapeHtml(card.name || "Без имени")}</h1>
    ${card.race ? `<h2>${escapeHtml(card.race)}</h2>` : ""}
    <div class="stats">
      <div class="stat-row"><span class="stat-label">С</span><span class="stat-value">${statValue(stats.s)}</span></div>
      <div class="stat-row"><span class="stat-label">Л</span><span class="stat-value">${statValue(stats.l)}</span></div>
      <div class="stat-row"><span class="stat-label">У</span><span class="stat-value">${statValue(stats.u)}</span></div>
      <div class="stat-row"><span class="stat-label">Ж</span><span class="stat-value">${statValue(stats.zh)}</span></div>
    </div>
    ${
      traits.length
        ? `<div class="traits">${traits.map((t) => `<div class="trait">${escapeHtml(t)}</div>`).join("")}</div>`
        : ""
    }
  </div>
`;

function statValue(v) {
  return v === undefined || v === null || v === "" ? "—" : escapeHtml(String(v));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

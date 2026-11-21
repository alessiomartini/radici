// Radici: tutto nel browser. FSRS (ts-fsrs) decide le scadenze, i progressi stanno in localStorage (+ backup esportabile).
import { fsrs, generatorParameters, createEmptyCard } from "https://cdn.jsdelivr.net/npm/ts-fsrs@6.0.0/+esm";
import { load as parseYaml } from "https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/+esm";

const CONTENT = ["content/meccanica-classica.yaml", "content/analisi-complessa.yaml"];  // un file per campo
const STORE = "radici-state";
// Niente passi di apprendimento in minuti: una sessione al giorno, intervalli in giorni.
const scheduler = fsrs(generatorParameters({ enable_short_term: false }));
const NEW_ATOMS_PER_DAY = 5;   // carte nuove "piccole" al giorno
const BIG = new Set(["teorema", "derivazione"]);  // al massimo una nuova al giorno, sono le sessioni a carta e penna
const MATURE_DAYS = 21;        // stabilità oltre cui una carta conta come consolidata

let items = [], state = { cards: {}, log: [] }, byId = {}, queue = [], current = null, view = "session";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Testo dei contenuti: paragrafi separati da riga vuota, **grassetto**, matematica $...$ resa da KaTeX.
const rich = (t) => esc(t).trim().split(/\n\s*\n/).map(p => `<p>${p.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</p>`).join("");
const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`; };
const today = dayKey(Date.now());
const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));
const isDue = (id) => state.cards[id] && new Date(state.cards[id].due) <= endOfToday;
const unlocked = (it) => (it.prereq || []).every(p => state.cards[p]);

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Nuove carte alternando i campi (interleaving), nell'ordine dei file (che rispetta i prerequisiti).
function interleave(list) {
  const groups = {};
  list.forEach(it => (groups[it.field] ??= []).push(it));
  const cols = Object.values(groups), out = [];
  for (let i = 0; out.length < list.length; i++) cols.forEach(c => c[i] && out.push(c[i]));
  return out;
}

function buildQueue() {
  const first = {}, doneToday = new Set();  // first: id -> giorno della prima revisione
  state.log.forEach(l => { first[l.item] ??= dayKey(l.review_datetime); if (dayKey(l.review_datetime) === today) doneToday.add(l.item); });
  const newToday = Object.keys(first).filter(id => first[id] === today);
  const newAtomsLeft = NEW_ATOMS_PER_DAY - newToday.filter(id => !BIG.has(byId[id]?.kind)).length;
  const newBigLeft = newToday.some(id => BIG.has(byId[id]?.kind)) ? 0 : 1;

  const due = items.filter(it => isDue(it.id) && !doneToday.has(it.id));
  const fresh = interleave(items.filter(it => !state.cards[it.id] && unlocked(it)));
  const atoms = [...due.filter(it => !BIG.has(it.kind)), ...fresh.filter(it => !BIG.has(it.kind)).slice(0, Math.max(0, newAtomsLeft))];
  const bigs = [...due.filter(it => BIG.has(it.kind)), ...fresh.filter(it => BIG.has(it.kind)).slice(0, newBigLeft)];
  queue = [...shuffle(atoms), ...shuffle(bigs)];  // prima i pezzi piccoli, poi la derivazione/teorema
}

function renderStats() {
  const seen = items.filter(it => state.cards[it.id]).length;
  const mature = items.filter(it => (state.cards[it.id]?.stability ?? 0) >= MATURE_DAYS).length;
  const exp = localStorage.getItem(STORE + "-exported");
  const days = exp ? Math.floor((Date.now() - new Date(exp)) / 864e5) : null;
  const warn = state.log.length && (days === null || days >= 7) ? ` · backup: ${days === null ? "mai" : days + " giorni fa"}` : "";
  $("#stats").textContent = `oggi: ${queue.length} da fare · viste ${seen}/${items.length} · consolidate ${mature}${warn}`;
}

function calendar() {
  const per = {};
  state.log.forEach(l => { const k = dayKey(l.review_datetime); per[k] = (per[k] || 0) + 1; });
  let html = "";
  for (let i = 29; i >= 0; i--) {
    const n = per[dayKey(Date.now() - i * 864e5)] || 0;
    html += `<span class="${n >= 8 ? "d2" : n ? "d1" : ""}" title="${n} ripassi"></span>`;
  }
  return `<h3>Ultimi 30 giorni</h3><div class="cal">${html}</div>`;
}

const link = (id) => `<a data-open="${id}">${esc(byId[id]?.title ?? id)}</a>`;

function itemHtml(it, revealed) {
  const st = state.cards[it.id];
  let h = `<div class="meta"><span class="kind">${esc(it.kind)}</span><span>${esc(it.field)}</span>`;
  if (st) h += `<span>stabilità ${st.stability.toFixed(1)} g</span>`;
  h += `</div><h2>${esc(it.title)}</h2><div class="prompt">${rich(it.prompt)}</div>`;
  if (it.prereq?.length) h += `<p class="hint">Prerequisiti: ${it.prereq.map(link).join(", ")}</p>`;
  if (!revealed) {
    h += `<p class="hint">${BIG.has(it.kind) ? "Carta e penna: scrivi la derivazione completa prima di guardare." : "Rispondi a voce o per iscritto, poi controlla."}</p>`;
    return h + `<div class="rate"><button id="reveal">Mostra risposta (spazio)</button></div>`;
  }
  h += `<section class="reveal"><h3>Risposta</h3>${rich(it.answer)}`;
  (it.solutions || []).forEach((s, i) => {
    h += `<details ${i === 0 ? "open" : ""}><summary>Soluzione ${i + 1}: ${esc(s.label)}</summary>${rich(s.steps)}`;
    (s.uses || []).forEach(u => { h += `<div class="uses"><span class="tag">⇄ usa un risultato da ${esc(u.field)}</span>${rich(u.result)}</div>`; });
    h += `</details>`;
  });
  if (it.connections?.length) {
    h += `<h3>Connessioni</h3>`;
    it.connections.forEach(c => { h += `<div class="conn"><span class="tag">⇄ ${esc(c.field)}</span>${rich(c.note)}</div>`; });
  }
  const after = items.filter(x => (x.prereq || []).includes(it.id));
  if (after.length) h += `<p class="hint">Serve per: ${after.map(x => link(x.id)).join(", ")}</p>`;
  return h + `</section>`;
}

function math(el) { if (window.renderMathInElement) renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false }); }

function renderSession(revealed = false) {
  view = "session";
  renderStats();
  current = queue[0];
  if (!current) {
    $("#main").innerHTML = `<div class="card"><h2>Fatto per oggi</h2><p>Nessuna carta in scadenza. Torna domani: la ripetizione funziona perché è distribuita nel tempo.</p>${calendar()}</div>`;
    return;
  }
  let h = `<div class="card">${itemHtml(current, revealed)}`;
  if (revealed) {
    h += `<div class="rate">${[["Di nuovo", "non lo sapevo"], ["Difficile", "con fatica"], ["Bene", "sì"], ["Facile", "subito"]]
      .map(([l, s], i) => `<button data-rate="${i + 1}">${i + 1} · ${l}<small>${s}</small></button>`).join("")}</div>`;
  }
  $("#main").innerHTML = h + `</div>`;
  math($("#main"));
}

function renderCatalog(openId) {
  view = "catalog";
  const fields = [...new Set(items.map(it => it.field))];
  let h = "";
  if (openId) h += `<div class="card">${itemHtml(byId[openId], true)}</div>`;
  fields.forEach(f => {
    h += `<h3>${esc(f)}</h3><ul class="list">`;
    items.filter(it => it.field === f).forEach(it => {
      const st = state.cards[it.id];
      const s = !st ? "nuova" : `prossimo ripasso ${new Date(st.due).toLocaleDateString("it")} · stabilità ${st.stability.toFixed(1)} g`;
      h += `<li>${link(it.id)} <span class="state">${esc(it.kind)} · ${s}</span></li>`;
    });
    h += `</ul>`;
  });
  $("#main").innerHTML = h + calendar();
  math($("#main"));
  window.scrollTo(0, 0);
}

const VERSION = 2;  // alzare quando cambia il contenuto (cache-busting)

function save() {
  localStorage.setItem(STORE, JSON.stringify(state));
}

// Backup: i progressi vivono solo in questo browser, quindi si esportano in un file ogni tanto.
function exportState() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: "application/json" }));
  a.download = `radici-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  localStorage.setItem(STORE + "-exported", new Date().toISOString());
  renderStats();
}
async function importState(file) {
  const data = JSON.parse(await file.text());
  if (!data.cards || !Array.isArray(data.log)) return alert("File non valido");
  if (!confirm(`Sostituire i progressi attuali (${state.log.length} ripassi) con quelli del file (${data.log.length} ripassi)?`)) return;
  state = data; save(); buildQueue(); renderSession();
}

function rate(r) {
  const id = current.id;
  const now = new Date(), old = state.cards[id];
  const card = old ? { ...old, due: new Date(old.due), last_review: old.last_review && new Date(old.last_review) } : createEmptyCard(now);
  state.cards[id] = JSON.parse(JSON.stringify(scheduler.next(card, now, r).card));  // date -> stringhe ISO
  state.log.push({ item: id, rating: r, review_datetime: now.toISOString() });
  save();
  queue.shift();
  if (r === 1) queue.push(current);  // "Di nuovo": la rivedi alla fine della sessione di oggi
  renderSession();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.id === "reveal") renderSession(true);
  else if (t.dataset.rate) rate(+t.dataset.rate);
  else if (t.dataset.open) renderCatalog(t.dataset.open);
  else if (t.id === "export") exportState();
  else if (t.id === "import") $("#import-file").click();
  else if (t.id === "tab-session" || t.id === "tab-catalog") {
    $("#tab-session").classList.toggle("on", t.id === "tab-session");
    $("#tab-catalog").classList.toggle("on", t.id === "tab-catalog");
    t.id === "tab-session" ? renderSession() : renderCatalog();
  }
});
document.addEventListener("keydown", (e) => {
  if (view !== "session" || !current || e.target.closest("textarea, input")) return;
  if (e.key === " " && $("#reveal")) { e.preventDefault(); renderSession(true); }
  else if ("1234".includes(e.key) && $("[data-rate]")) rate(+e.key);
});

// Tema chiaro/scuro (default: segue il sistema), come in conceptual-map-physics-math.
const sysDark = () => matchMedia("(prefers-color-scheme: dark)").matches;
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const dark = t ? t === "dark" : sysDark();
  $(".theme-btn").textContent = dark ? "☀ Chiaro" : "☾ Scuro";
}
let theme = null; try { theme = localStorage.getItem("radici-theme"); } catch (e) {}
applyTheme(theme);
$(".theme-btn").addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : sysDark();
  theme = dark ? "light" : "dark"; applyTheme(theme);
  try { localStorage.setItem("radici-theme", theme); } catch (e) {}
});

$("#import-file").addEventListener("change", (e) => e.target.files[0] && importState(e.target.files[0]));
window.addEventListener("load", async () => {
  window.SiteNotes?.setContext(() => ({ view, item: current?.id ?? null }));
  try {
    items = (await Promise.all(CONTENT.map(async f => parseYaml(await (await fetch(f + "?v=" + VERSION)).text())))).flat();
    byId = Object.fromEntries(items.map(it => [it.id, it]));
    state = JSON.parse(localStorage.getItem(STORE) || '{"cards":{},"log":[]}');
    buildQueue(); renderSession();
  } catch (e) {
    $("#main").innerHTML = `<p class="err">Errore nel caricamento: ${esc(e.message)}.</p>`;
  }
});

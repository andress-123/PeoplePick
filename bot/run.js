// Bot de tendencias de PeoplePick.
//
//   node bot/run.js                          → modo simulación (por defecto): genera bot/out/preview.html
//   BOT_MODE=activo node bot/run.js          → además envía las propuestas a tu Telegram y registra el historial
//   node bot/run.js --fixture f.xml --counts c.json   → prueba sin red con datos guardados
//
// El bot NO publica en X: te prepara tuit, imagen y respuesta para que publiques tú.
// Las normas de X prohíben publicar de forma automática sobre temas que son tendencia.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { CONFIG } from "./config.js";
import { fetchTrends, parseTrends, buildIndex, matchTrend, sensitiveHit, cooldownBlock, postsToday,
  fetchCounts, rankingFor, composeTweet, composeReply, catEs } from "./lib.js";
import { renderCard, fetchPhoto } from "./card.js";

const arg = k => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const MODE = (process.env.BOT_MODE || "simulacion").toLowerCase();
const ACTIVE = MODE === "activo";
const ROOT = new URL("../", import.meta.url);
const OUT = new URL("bot/out/", ROOT);
const STATE_FILE = new URL("bot/state.json", ROOT);

const people = JSON.parse(readFileSync(new URL("data/people.json", ROOT), "utf8"));
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : { posts: [] };

const log = (...a) => console.log(...a);

async function main() {
  log(`▶ PeoplePick bot · modo ${ACTIVE ? "ACTIVO (Telegram)" : "SIMULACIÓN"}`);
  const trends = arg("--fixture") ? parseTrends(readFileSync(arg("--fixture"), "utf8")) : await fetchTrends();
  let counts = {};
  try { counts = arg("--counts") ? JSON.parse(readFileSync(arg("--counts"), "utf8")) : await fetchCounts(); }
  catch (e) { log(`· Sin marcador de Firestore (${e.message}); los puestos no se mostrarán`); }
  log(`· ${trends.length} tendencias en España`);

  const index = buildIndex(people);
  const proposals = [], discarded = [];
  const seen = new Set();
  let budget = Math.max(0, Math.min(CONFIG.maxPerRun, CONFIG.maxPerDay - postsToday(state)));

  for (const trend of trends) {
    const m = matchTrend(trend, index);
    if (!m) continue;
    const person = m.person;
    if (seen.has(person.id)) continue;
    seen.add(person.id);
    const sens = sensitiveHit(trend);
    if (sens) { discarded.push({ trend: trend.title, person: person.name, reason: `tema sensible («${sens}»)`, news: trend.news.slice(0, 2) }); continue; }
    const cd = cooldownBlock(state, person.id);
    if (cd) { discarded.push({ trend: trend.title, person: person.name, reason: cd }); continue; }
    if (budget <= 0) { discarded.push({ trend: trend.title, person: person.name, reason: "límite de publicaciones alcanzado" }); continue; }
    budget--;

    const ranking = rankingFor(person, people, counts);
    const tweet = composeTweet(person, trend, ranking, state.posts.length + proposals.length);
    const reply = composeReply(person);
    const photo = await fetchPhoto(person);
    const png = await renderCard(person, ranking, photo);
    proposals.push({ person, trend, ranking, tweet, reply, png, how: m.how });
    log(`✓ ${person.name} ← «${trend.title}»`);
  }

  // ── Previsualización ───────────────────────────────────────────────────────
  mkdirSync(OUT, { recursive: true });
  proposals.forEach(p => writeFileSync(new URL(`${p.person.id}.png`, OUT), p.png));
  writeFileSync(new URL("report.json", OUT), JSON.stringify({
    at: new Date().toISOString(), mode: MODE, trends: trends.length,
    proposals: proposals.map(p => ({ person: p.person.name, trend: p.trend.title, tweet: p.tweet.text, reply: p.reply.text, ranking: p.ranking })),
    discarded,
  }, null, 2));
  writeFileSync(new URL("preview.html", OUT), previewHtml(trends, proposals, discarded));
  log(`· Previsualización: bot/out/preview.html (${proposals.length} propuestas, ${discarded.length} descartadas)`);

  // ── Envío a Telegram (solo en modo activo) ────────────────────────────────
  if (ACTIVE && proposals.length) {
    const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) throw new Error("Faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
    for (const p of proposals) {
      await telegramPhoto(token, chat, p.png, `${p.tweet.text}`);
      await telegramText(token, chat, `Respuesta al tuit (publícala unos minutos después):\n\n${p.reply.text}`);
      state.posts.push({ personId: p.person.id, trend: p.trend.title, at: new Date().toISOString() });
    }
    state.posts = state.posts.filter(x => Date.now() - Date.parse(x.at) < 60 * 864e5);
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
    log(`· Enviado a Telegram y guardado en bot/state.json`);
  }
}

async function telegramPhoto(token, chat, png, caption) {
  const fd = new FormData();
  fd.append("chat_id", chat);
  fd.append("caption", caption);
  fd.append("photo", new Blob([png], { type: "image/png" }), "peoplepick.png");
  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(`Telegram sendPhoto ${r.status}: ${await r.text()}`);
}
async function telegramText(token, chat, text) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }) });
  if (!r.ok) throw new Error(`Telegram sendMessage ${r.status}: ${await r.text()}`);
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function previewHtml(trends, proposals, discarded) {
  const when = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  const card = p => `
  <article class="p">
    <img src="data:image/png;base64,${p.png.toString("base64")}" alt="Tarjeta de ${esc(p.person.name)}">
    <div class="t"><span class="lbl">Tuit principal · ${[...p.tweet.text].length}/280</span><p>${esc(p.tweet.text)}</p></div>
    <div class="t r"><span class="lbl">Respuesta (unos minutos después)</span><p>${esc(p.reply.text)}</p></div>
    <p class="meta">Tendencia «${esc(p.trend.title)}» ${p.trend.traffic ? `· ${esc(p.trend.traffic)} búsquedas` : ""} · cruce por ${p.how} · ${catEs(p.person.category)}${p.trend.news[0] ? ` · fuente: ${esc(p.trend.news[0].source)}` : ""}</p>
  </article>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PeoplePick bot · previsualización</title>
<style>
body{margin:0;background:#f6f7fb;color:#09090b;font:15px/1.5 Inter,system-ui,sans-serif;padding:24px 16px 64px}
main{max-width:760px;margin:0 auto}
h1{font-size:26px;margin:0 0 4px;letter-spacing:-.5px} .sub{color:#64748b;margin:0 0 24px}
.p{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;margin-bottom:20px}
.p img{width:100%;border-radius:12px;border:1px solid #e2e8f0;display:block}
.t{margin-top:14px;padding:12px 14px;border-radius:12px;background:#f8fafc} .t p{margin:4px 0 0;white-space:pre-wrap}
.t.r{background:#eff6ff} .lbl{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em}
.meta{font-size:12px;color:#94a3b8;margin:10px 2px 0}
h2{font-size:17px;margin:32px 0 10px} ul{padding-left:18px;color:#475569} li{margin:4px 0}
.empty{background:#fff;border:1px dashed #cbd5e1;border-radius:14px;padding:20px;color:#64748b}
</style></head><body><main>
<h1>Previsualización del bot</h1>
<p class="sub">${esc(when)} · modo ${ACTIVE ? "activo" : "simulación"} · ${trends.length} tendencias revisadas</p>
${proposals.length ? proposals.map(card).join("") : `<p class="empty">Ninguna tendencia de ahora mismo coincide con alguien de la base y pasa los filtros.</p>`}
<h2>Descartadas (${discarded.length})</h2>
${discarded.length ? `<ul>${discarded.map(d => `<li><b>${esc(d.person)}</b> · «${esc(d.trend)}» → ${esc(d.reason)}</li>`).join("")}</ul>` : `<p class="sub">Ninguna.</p>`}
<h2>Tendencias sin nadie de la base</h2>
<ul>${trends.filter(t => !matchTrend(t, buildIndex(people))).map(t => `<li>${esc(t.title)}</li>`).join("")}</ul>
</main></body></html>`;
}

main().catch(e => { console.error("✗", e.message); process.exit(1); });

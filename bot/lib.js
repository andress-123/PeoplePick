// Piezas del bot: tendencias, cruce con la base, filtros, ranking y textos.
import { XMLParser } from "fast-xml-parser";
import { CONFIG } from "./config.js";

export const norm = s => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();

const CAT_ES = { Sports: "Deporte", Music: "Música", Cinema: "Cine", TV: "Televisión", Politics: "Política",
  Business: "Empresa", Technology: "Tecnología", Science: "Ciencia", Internet: "Internet", Art: "Arte",
  Fashion: "Moda", Literature: "Literatura", Philosophy: "Filosofía", History: "Historia", Religion: "Religión",
  Activism: "Activismo", Gastronomy: "Gastronomía", Royalty: "Realeza" };
export const catEs = c => CAT_ES[c] || c;

// ── 1. Tendencias (Google Trends RSS) ────────────────────────────────────────
export function parseTrends(xml) {
  const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true });
  const items = [].concat(parser.parse(xml)?.rss?.channel?.item || []);
  return items.map(it => ({
    title: String(it.title || "").trim(),
    traffic: String(it.approx_traffic || ""),
    news: [].concat(it.news_item || []).map(n => ({
      title: String(n.news_item_title || "").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim(),
      source: String(n.news_item_source || ""),
      url: String(n.news_item_url || ""),
    })).filter(n => n.title),
  })).filter(t => t.title);
}

export async function fetchTrends() {
  const r = await fetch(CONFIG.trendsUrl, { headers: { "User-Agent": "Mozilla/5.0 PeoplePickBot" } });
  if (!r.ok) throw new Error(`Google Trends respondió ${r.status}`);
  return parseTrends(await r.text());
}

// ── 2. Cruce con la base de personas ─────────────────────────────────────────
// Coincide el nombre completo; el apellido solo vale si lo lleva una única persona y es poco común.
const COMMON = new Set(["garcia", "lopez", "martin", "martinez", "sanchez", "perez", "gonzalez", "rodriguez", "fernandez",
  "gomez", "diaz", "moreno", "alvarez", "romero", "ruiz", "hernandez", "jimenez", "torres", "ramos", "navarro", "dominguez",
  "vazquez", "gil", "serrano", "blanco", "castro", "suarez", "ortega", "rubio", "molina", "delgado", "morales", "ortiz",
  "marin", "iglesias", "silva", "santos", "jackson", "johnson", "williams", "smith", "brown", "jones", "james", "lee",
  "king", "young", "scott", "allen", "evans", "ford", "grande", "rey", "bravo", "cruz", "leon", "paz", "luna"]);

export function buildIndex(people) {
  const full = new Map(), surname = new Map();
  for (const p of people) {
    const n = norm(p.name.replace(/\(.*?\)/g, ""));
    if (n.length >= 4) full.set(n, p);
    const parts = n.split(" ");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (last.length >= 5 && !COMMON.has(last)) surname.set(last, surname.has(last) ? null : p);
    }
  }
  return { full, surname };
}

const RELATIVE = /\b(hij[oa]s?|madre|padre|herman[oa]s?|novi[oa]|pareja|mujer|marido|espos[oa]|ex|nietos?|nietas?|sobrin[oa]s?|prim[oa]|suegr[oa]|cunad[oa])\s+de\b/;
export const aboutRelative = trend => RELATIVE.test(norm(trend.title));

export function matchTrend(trend, index) {
  const t = norm(trend.title);
  const padded = ` ${t} `;
  // nombre completo dentro de la tendencia ("rosalia lux", "pedro sanchez debate")
  let best = null;
  for (const [n, p] of index.full) {
    if (padded.includes(` ${n} `) && (!best || n.length > best.n.length)) best = { n, p };
  }
  if (best) return { person: best.p, how: "nombre" };
  // tendencia = apellido único ("feijoo", "abascal", "mbappe")
  const words = t.split(" ");
  if (words.length <= 2) {
    for (const w of words) {
      const p = index.surname.get(w);
      if (p) {
        // confirmación: algún titular menciona el nombre o el apellido
        const ok = trend.news.length === 0 || trend.news.some(nw => norm(nw.title).includes(w));
        if (ok) return { person: p, how: "apellido" };
      }
    }
  }
  return null;
}

// ── 3. Filtros editoriales ───────────────────────────────────────────────────
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SENSITIVE_RE = CONFIG.sensitive.map(w => [w.trim(), new RegExp(`(^|[^\\p{L}])${esc(w)}`, "iu")]);
export function sensitiveHit(trend) {
  const texts = [trend.title, ...trend.news.map(n => n.title)].map(s => ` ${s} `);
  for (const [w, re] of SENSITIVE_RE) {
    if (texts.some(t => re.test(t))) return w;
  }
  return null;
}

export function cooldownBlock(state, personId, now = Date.now()) {
  const last = state.posts.filter(p => p.personId === personId).map(p => Date.parse(p.at)).sort().pop();
  if (last && now - last < CONFIG.cooldownDays * 864e5) {
    const days = Math.ceil((CONFIG.cooldownDays * 864e5 - (now - last)) / 864e5);
    return `ya se publicó hace poco (vuelve a estar disponible en ${days} día${days === 1 ? "" : "s"})`;
  }
  return null;
}

export function postsToday(state, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return state.posts.filter(p => p.at.slice(0, 10) === day).length;
}

// ── 4. Ranking (marcador público de Firestore) ───────────────────────────────
export async function fetchCounts() {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.firebaseProjectId}/databases/(default)/documents/stats/votes`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Firestore respondió ${r.status}`);
  const j = await r.json();
  const fields = j.fields?.counts?.mapValue?.fields || {};
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, Number(v.integerValue ?? v.doubleValue ?? 0)]));
}

export function rankingFor(person, people, counts) {
  const votes = counts[person.id] || 0;
  if (votes <= 0) return { votes, hasRank: false };
  const inCat = people.filter(p => p.category === person.category)
    .map(p => counts[p.id] || 0).filter(v => v > 0).sort((a, b) => b - a);
  const all = people.map(p => counts[p.id] || 0).filter(v => v > 0).sort((a, b) => b - a);
  return {
    votes, hasRank: true,
    catRank: inCat.indexOf(votes) + 1,
    rank: all.indexOf(votes) + 1,
    showCount: votes >= CONFIG.minVotesToShowCount,
  };
}

// ── 5. Textos del tuit ───────────────────────────────────────────────────────
export function hashtagFor(person, trend) {
  // Un solo hashtag: el término de la tendencia si es corto, si no el nombre.
  const base = trend.title.split(" ").length <= 3 ? trend.title : person.name;
  const tag = base.replace(/\(.*?\)/g, "").split(/[\s\-.'’]+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join("").replace(/[^\p{L}\p{N}_]/gu, "");
  return tag ? `#${tag}` : "";
}

export function cleanHeadline(h) {
  let t = h.replace(/\s[-|–—]\s[^-|–—]{2,40}$/, "").replace(/\s+/g, " ").trim(); // quita " - El País"
  t = t.replace(/[.:;,]+$/, "");
  if (t.length > 120) t = t.slice(0, 117).replace(/\s\S*$/, "") + "…";
  return t;
}

export function rankPhrase(r, person) {
  const cat = catEs(person.category);
  if (!r.hasRank) return null;
  if (r.catRank === 1) return `en el número 1 de ${cat}`;
  return `en el puesto ${r.catRank} de ${cat}`;
}

// Plantillas sin emojis ni tono publicitario. {h} = titular, {n} = nombre, {r} = puesto, {c} = categoría
const WITH_RANK = [
  "{n} vuelve a estar en boca de todos: {h}. En PeoplePick está {r}. ¿Sube o baja después de esto?",
  "{h}. ¿Cambia esto lo que piensas de {n}? Ahora mismo está {r} en PeoplePick.",
  "Hoy se habla de {n}: {h}. La gente le tiene {r}. ¿Le sobra o le falta?",
  "Lo de {n} da para debate. {h}. Está {r} en el ranking de la gente. ¿Merece más o menos?",
  "{n}, tendencia: {h}. En PeoplePick está {r}. ¿Es donde tiene que estar?",
];
const NO_RANK = [
  "{n} vuelve a estar en boca de todos: {h}. ¿Qué puesto le darías en el ranking de {c}?",
  "{h}. ¿Cambia esto lo que piensas de {n}? En PeoplePick su puesto en {c} lo decide la gente.",
  "Hoy se habla de {n}: {h}. ¿Arriba o abajo en el ranking de {c}?",
  "Lo de {n} da para debate. {h}. ¿Merece subir en el ranking de {c}?",
];

export function composeTweet(person, trend, r, seed = 0) {
  const headline = trend.news[0] ? cleanHeadline(trend.news[0].title) : `es tendencia en España`;
  const phrase = rankPhrase(r, person);
  const pool = phrase ? WITH_RANK : NO_RANK;
  const tag = hashtagFor(person, trend);
  for (let k = 0; k < pool.length; k++) {
    let t = pool[(seed + k) % pool.length]
      .replace("{n}", person.name).replace("{h}", headline).replace("{r}", phrase || "")
      .replace("{c}", catEs(person.category)).replace(/\.\./g, ".").replace(/\s+/g, " ").trim();
    // el hashtag solo se añade si no repite literalmente el nombre ya escrito
    if (tag) t += ` ${tag}`;
    if ([...t].length <= 270) return { text: t, hashtag: tag, headline };
  }
  // titular demasiado largo: versión corta
  const short = `${person.name} es tendencia. ${phrase ? `En PeoplePick está ${phrase}.` : ""} ¿Sube o baja? ${tag}`.replace(/\s+/g, " ").trim();
  return { text: short, hashtag: tag, headline };
}

export function composeReply(person) {
  const url = `${CONFIG.siteUrl}/p/${person.id}?utm_source=x&utm_medium=social&utm_campaign=tendencias`;
  return { text: `Para votar a ${person.name} en un clic: ${url}`, url };
}

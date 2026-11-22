// Tarjeta 1200×675 con la identidad de PeoplePick: fondo blanco, punto azul, la fila de la lista.
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { catEs } from "./lib.js";
import { CONFIG } from "./config.js";

const require = createRequire(import.meta.url);
const fontFile = (w, sub) => readFileSync(require.resolve(`@fontsource/inter/files/inter-${sub}-${w}-normal.woff`));
const FONTS = [400, 600, 800].flatMap(w => ["latin", "latin-ext"].map(sub => ({ name: "Inter", data: fontFile(w, sub), weight: w, style: "normal" })));

const ISO = { "Argentina":"AR","Australia":"AU","Austria":"AT","Belgium":"BE","Brazil":"BR","Canada":"CA","Chile":"CL","China":"CN",
  "Colombia":"CO","Cuba":"CU","Czech Republic":"CZ","Denmark":"DK","Egypt":"EG","Finland":"FI","France":"FR","Germany":"DE",
  "Greece":"GR","Hungary":"HU","India":"IN","Ireland":"IE","Israel":"IL","Italy":"IT","Japan":"JP","Mexico":"MX","Netherlands":"NL",
  "Norway":"NO","Pakistan":"PK","Peru":"PE","Poland":"PL","Portugal":"PT","Russia":"RU","Serbia":"RS","South Africa":"ZA",
  "Spain":"ES","Sweden":"SE","Switzerland":"CH","Turkey":"TR","UK":"GB","Ukraine":"UA","USA":"US","Venezuela":"VE","Jamaica":"JM",
  "Barbados":"BB","Puerto Rico":"PR","Trinidad and Tobago":"TT","New Zealand":"NZ","South Korea":"KR","Nigeria":"NG","Kenya":"KE",
  "Ghana":"GH","Ethiopia":"ET","Cameroon":"CM","Congo":"CD","Burkina Faso":"BF","Tunisia":"TN","Morocco":"MA","Palestine":"PS",
  "Saudi Arabia":"SA","Iran":"IR","Myanmar":"MM","Vietnam":"VN","Philippines":"PH","Singapore":"SG","Mongolia":"MN","Kazakhstan":"KZ",
  "Slovenia":"SI","Croatia":"HR","Guatemala":"GT","Albania":"AL","Belarus":"BY","Bulgaria":"BG","Dominican Republic":"DO",
  "El Salvador":"SV","Gabon":"GA","Georgia":"GE","Iceland":"IS","Ivory Coast":"CI","Monaco":"MC","Panama":"PA","Qatar":"QA",
  "Romania":"RO","Thailand":"TH","Uruguay":"UY","Tibet":"CN" };

function flagDataUri(country) {
  const code = ISO[country];
  if (!code) return null;
  try {
    const svg = require("country-flag-icons/string/3x2")[code];
    if (!svg) return null;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch { return null; }
}

// Foto + crédito de Wikipedia (título exacto del campo wiki)
export async function fetchPhoto(person) {
  if (!person.wiki) return null;
  const lang = person.wikiLang || "en";
  const api = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(person.wiki)}&redirects=1&prop=pageimages&piprop=thumbnail|name&pithumbsize=600&format=json&formatversion=2`;
  try {
    const j = await (await fetch(api, { headers: { "User-Agent": "PeoplePickBot/1.0 (social cards)" } })).json();
    const page = j.query?.pages?.[0];
    if (!page?.thumbnail?.source) return null;
    const img = await fetch(page.thumbnail.source, { headers: { "User-Agent": "PeoplePickBot/1.0 (social cards)" } });
    const buf = Buffer.from(await img.arrayBuffer());
    const type = img.headers.get("content-type") || "image/jpeg";
    let credit = "Wikimedia Commons";
    if (page.pageimage) {
      const info = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(page.pageimage)}&prop=imageinfo&iiprop=extmetadata&format=json&formatversion=2`,
        { headers: { "User-Agent": "PeoplePickBot/1.0 (social cards)" } })).json();
      const md = info.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata || {};
      const artist = (md.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
      const lic = (md.LicenseShortName?.value || "").trim();
      credit = [artist, lic].filter(Boolean).join(" · ") || credit;
    }
    return { dataUri: `data:${type};base64,${buf.toString("base64")}`, credit: `Foto: ${credit}` };
  } catch { return null; }
}

const h = (type, style, children) => ({ type, props: { style, children } });
const initials = n => { const w = n.replace(/\(.*?\)/g, "").split(/[\s-]+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : w[0].slice(0, 2)).toUpperCase(); };
const COUNTRY_ES = { Spain: "España", USA: "EE. UU.", UK: "Reino Unido", France: "Francia", Germany: "Alemania", Italy: "Italia",
  Brazil: "Brasil", Mexico: "México", Netherlands: "Países Bajos", Belgium: "Bélgica", Japan: "Japón", Russia: "Rusia",
  Ukraine: "Ucrania", Canada: "Canadá", Morocco: "Marruecos", Norway: "Noruega", Sweden: "Suecia", Switzerland: "Suiza",
  Ireland: "Irlanda", Poland: "Polonia", Croatia: "Croacia", Turkey: "Turquía", "South Korea": "Corea del Sur", Peru: "Perú",
  Egypt: "Egipto", Greece: "Grecia", Denmark: "Dinamarca", Slovenia: "Eslovenia", "South Africa": "Sudáfrica",
  "New Zealand": "Nueva Zelanda", "Czech Republic": "Chequia", Hungary: "Hungría", Finland: "Finlandia", "Ivory Coast": "Costa de Marfil",
  Cameroon: "Camerún", "Dominican Republic": "República Dominicana", Thailand: "Tailandia", Belarus: "Bielorrusia", Romania: "Rumanía" };

export async function renderCard(person, ranking, photo) {
  const blue = "#2563eb", ink = "#09090b", muted = "#64748b", line = "#e2e8f0";
  const flag = flagDataUri(person.country);
  const site = CONFIG.siteUrl.replace(/^https?:\/\//, "");

  const avatar = photo
    ? { type: "img", props: { src: photo.dataUri, width: 300, height: 300, style: { width: 300, height: 300, borderRadius: 150, objectFit: "cover" } } }
    : h("div", { width: 300, height: 300, borderRadius: 150, background: "#dbeafe", color: "#1d4ed8", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 96, fontWeight: 800 }, initials(person.name));

  // Bloque de puesto: nunca cifras bajas
  let rankBlock;
  if (ranking.hasRank) {
    const medal = ranking.catRank <= 3 ? ["#f59e0b", "#94a3b8", "#b45309"][ranking.catRank - 1] : ink;
    rankBlock = h("div", { display: "flex", flexDirection: "column", alignItems: "flex-start" }, [
      h("div", { fontSize: 22, fontWeight: 600, color: muted, letterSpacing: 2, textTransform: "uppercase" }, `Ranking ${catEs(person.category)}`),
      h("div", { fontSize: 120, fontWeight: 800, color: medal, lineHeight: 1, marginTop: 6, letterSpacing: -4 }, `#${ranking.catRank}`),
      ranking.showCount
        ? h("div", { fontSize: 26, fontWeight: 600, color: muted, marginTop: 10 }, `${ranking.votes.toLocaleString("es-ES")} votos`)
        : h("div", { fontSize: 26, fontWeight: 600, color: muted, marginTop: 10 }, "según la gente"),
    ]);
  } else {
    rankBlock = h("div", { display: "flex", flexDirection: "column", alignItems: "flex-start" }, [
      h("div", { fontSize: 22, fontWeight: 600, color: muted, letterSpacing: 2, textTransform: "uppercase" }, `Ranking ${catEs(person.category)}`),
      h("div", { fontSize: 64, fontWeight: 800, color: ink, lineHeight: 1.05, marginTop: 10, letterSpacing: -2 }, "¿Qué puesto"),
      h("div", { fontSize: 64, fontWeight: 800, color: blue, lineHeight: 1.05, letterSpacing: -2 }, "le das?"),
    ]);
  }

  const tree = h("div", { width: 1200, height: 675, background: "#ffffff", display: "flex", flexDirection: "column",
    fontFamily: "Inter", padding: "48px 64px 40px", color: ink }, [
    // cabecera
    h("div", { display: "flex", alignItems: "center", gap: 14 }, [
      h("div", { width: 18, height: 18, borderRadius: 9, background: blue }),
      h("div", { fontSize: 34, fontWeight: 800, letterSpacing: -1 }, "PeoplePick"),
      h("div", { marginLeft: "auto", fontSize: 22, color: muted, fontWeight: 600 }, "El ranking que decide la gente"),
    ]),
    // ficha
    h("div", { display: "flex", alignItems: "center", flex: 1, gap: 56, marginTop: 12 }, [
      avatar,
      h("div", { display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }, [
        h("div", { fontSize: person.name.length > 22 ? 58 : 72, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1.02 }, person.name.replace(/\s*\(.*?\)/g, "")),
        h("div", { display: "flex", alignItems: "center", gap: 14, marginTop: 18, fontSize: 28, color: muted, fontWeight: 600 }, [
          h("div", {}, catEs(person.category)),
          h("div", { color: "#cbd5e1" }, "·"),
          ...(flag ? [{ type: "img", props: { src: flag, width: 39, height: 26, style: { borderRadius: 4 } } }] : []),
          h("div", {}, COUNTRY_ES[person.country] || person.country),
        ]),
        h("div", { display: "flex", height: 2, background: line, marginTop: 34, marginBottom: 30, width: "100%" }),
        rankBlock,
      ]),
    ]),
    // pie
    h("div", { display: "flex", alignItems: "center", borderTop: `2px solid ${line}`, paddingTop: 18 }, [
      h("div", { fontSize: 28, fontWeight: 800, color: blue }, `${site}/p/${person.id}`),
      h("div", { marginLeft: "auto", fontSize: 16, color: "#94a3b8", maxWidth: 460, textAlign: "right" }, photo ? photo.credit : ""),
    ]),
  ]);

  const svg = await satori(tree, { width: 1200, height: 675, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}

// Ajustes del bot de X. Todo lo que quieras afinar está aquí.
export const CONFIG = {
  // Dónde vive la web (sin barra final). Se puede cambiar con la variable SITE_URL.
  siteUrl: process.env.SITE_URL || "https://people-pick-lsy9.vercel.app",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "peoplepick-d8937",

  // Fuente de tendencias (gratis): Google Trends, España
  trendsUrl: "https://trends.google.com/trending/rss?geo=ES",

  // Ritmo
  cooldownDays: 7,        // no repetir a la misma persona antes de X días
  maxPerDay: 3,           // máximo de propuestas al día
  maxPerRun: Number(process.env.BOT_MAX_PER_RUN || 1),          // máximo por ejecución (el workflow corre cada hora)

  // Autoridad: por debajo de este número de votos no se enseña la cifra, solo el puesto
  minVotesToShowCount: 1000,

  // Filtro editorial: si la tendencia o CUALQUIERA de sus titulares contiene una de estas
  // raíces, se descarta. Mejor perder una ocasión que publicar sobre una tragedia.
  sensitive: [
    "muer", "muri", "fallec", "falleci", "defunci", "luto", "velatorio", "funeral", "entierro", "esquela", "descanse en paz",
    "dep ", "r.i.p", "rip ", "asesin", "homicid", "crimen", "delito", "deten", "arrest", "prisión", "cárcel", "carcel",
    "juicio", "juzgad", "condena", "imputad", "investigad", "acusad", "denuncia", "fiscal", "polic", "guardia civil",
    "agresi", "abuso", "violaci", "violen", "maltrat", "acoso", "víctima", "victima", "secuestr", "atentado", "terror",
    "disparo", "tiroteo", "apuñal", "accidente", "choque", "atropell", "incendio", "naufragio", "tragedia", "catástrofe",
    "hospital", "ingresad", "uci", "cáncer", "cancer", "tumor", "enfermedad", "enfermo", "diagnóstic", "infarto", "ictus",
    "operad", "cirugía", "grave", "salud mental", "suicid", "sobredosis", "adicci", "desaparec", "herido", "heridos",
    "dies", "dead", "death", "killed", "arrested", "accident", "hospitali", "cancer", "illness", "lawsuit", "charged",
  ],
};

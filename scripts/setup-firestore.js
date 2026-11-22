// Puesta en marcha de Firestore para PeoplePick (se ejecuta una vez, y para dar de alta admins).
//
//   node scripts/setup-firestore.js                       → crea el marcador stats/votes si no existe
//   node scripts/setup-firestore.js --admin tu@email.com  → además da permisos de admin a esa cuenta
//                                                           (antes tiene que haber entrado una vez en la web)
//
// Necesita serviceAccountKey.json en la raíz del proyecto (Firebase Console → Configuración del
// proyecto → Cuentas de servicio → Generar nueva clave privada). No lo subas nunca a GitHub.
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const key = JSON.parse(readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf8"));
initializeApp({ credential: cert(key) });
const db = getFirestore();

const stats = db.doc("stats/votes");
if (!(await stats.get()).exists) {
  await stats.set({ counts: {}, last: { uid: "", pid: "" } });
  console.log("✓ Marcador stats/votes creado (todos empiezan a 0)");
} else {
  console.log("· El marcador stats/votes ya existía, no se toca");
}

const i = process.argv.indexOf("--admin");
if (i > -1) {
  const email = process.argv[i + 1];
  try {
    const u = await getAuth().getUserByEmail(email);
    await db.doc(`admins/${u.uid}`).set({ email, at: FieldValue.serverTimestamp() });
    console.log(`✓ ${email} ya es admin`);
  } catch {
    console.log(`✗ No encuentro la cuenta ${email}. Entra antes una vez en la web con Google y repite.`);
  }
}
process.exit(0);

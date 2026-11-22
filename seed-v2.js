// seed-v2.js — carga la base nueva de PeoplePick (personas + eventos) en Firestore
//
// Uso:
//   node seed-v2.js            → simulacro: cuenta lo que haría, no escribe nada
//   node seed-v2.js --write    → crea/actualiza personas y eventos (conserva los votos que ya existan)
//   node seed-v2.js --write --replace
//                              → además borra de /people los documentos antiguos que no estén
//                                en la base nueva (antes guarda una copia en backup-people-<fecha>.json)
//
// Requiere serviceAccountKey.json en esta carpeta (igual que seed.js).

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const WRITE = process.argv.includes('--write');
const REPLACE = process.argv.includes('--replace');

const people = JSON.parse(readFileSync(new URL('./data/people.json', import.meta.url), 'utf8'));
const events = JSON.parse(readFileSync(new URL('./data/events.json', import.meta.url), 'utf8'));

const serviceAccount = require('./serviceAccountKey.json');
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function commitInBatches(ops, label) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach(fn => fn(batch));
    if (WRITE) await batch.commit();
    console.log(`  ${label}: ${Math.min(i + 450, ops.length)}/${ops.length}`);
  }
}

async function run() {
  console.log(WRITE ? '▶ Modo ESCRITURA' : '▶ Simulacro (añade --write para escribir)');
  console.log(`  Base nueva: ${people.length} personas · ${events.length} eventos\n`);

  // ── People: id estable = slug del nombre. Nunca se pisan los votos existentes.
  const existing = await db.collection('people').get();
  const existingIds = new Set(existing.docs.map(d => d.id));
  const newIds = new Set(people.map(p => p.id));
  const now = Timestamp.now();

  let created = 0, updated = 0;
  const peopleOps = people.map(p => {
    const ref = db.collection('people').doc(p.id);
    const data = {
      name: p.name, category: p.category, country: p.country, sub: p.sub,
      tags: p.tags, events: p.events || [], updatedAt: now,
    };
    if (p.wiki) data.wiki = p.wiki;
    if (existingIds.has(p.id)) { updated++; return b => b.set(ref, data, { merge: true }); }
    created++;
    return b => b.set(ref, { ...data, votes: 0, createdAt: now });
  });
  console.log(`Personas → ${created} nuevas, ${updated} actualizadas`);
  await commitInBatches(peopleOps, 'personas');

  // ── Events
  const eventOps = events.map(e => {
    const ref = db.collection('events').doc(e.id);
    return b => b.set(ref, { ...e, updatedAt: now }, { merge: true });
  });
  console.log(`\nEventos → ${events.length}`);
  await commitInBatches(eventOps, 'eventos');

  // ── Limpieza opcional de documentos antiguos (p. ej. los IDs aleatorios del seed.js anterior)
  const stale = existing.docs.filter(d => !newIds.has(d.id));
  console.log(`\nDocumentos antiguos en /people que no están en la base nueva: ${stale.length}`);
  if (REPLACE && stale.length) {
    const file = `backup-people-${new Date().toISOString().slice(0, 10)}.json`;
    writeFileSync(file, JSON.stringify(stale.map(d => ({ id: d.id, ...d.data() })), null, 1));
    console.log(`  Copia guardada en ${file}`);
    await commitInBatches(stale.map(d => b => b.delete(d.ref)), 'borrados');
  } else if (stale.length) {
    console.log('  (no se borran; usa --replace si quieres eliminarlos)');
  }

  console.log(WRITE ? '\n✅ Hecho.' : '\nSimulacro terminado. Nada se ha escrito.');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });

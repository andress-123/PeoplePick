// Tests de las reglas de Firestore. Se ejecutan con el emulador:
//   npm run test:rules
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, writeBatch, increment, serverTimestamp, FieldPath, collection, addDoc } from "firebase/firestore";
import { applyVote } from "../src/voteOps.js";

let env;
const db = uid => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const counts = async () => {
  let c;
  await env.withSecurityRulesDisabled(async ctx => { c = (await getDoc(doc(ctx.firestore(), "stats/votes"))).data().counts; });
  return c;
};

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-peoplepick",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const f = ctx.firestore();
    await setDoc(doc(f, "stats/votes"), { counts: {} });
    await setDoc(doc(f, "admins/boss"), { email: "boss@example.com" });
  });
});

// ── Votar ────────────────────────────────────────────────────────────────────
test("sin cuenta no se puede votar", async () => {
  await assertFails(applyVote(db(null), "anon", "lionel-messi", 0, 1));
});

test("una cuenta vota, cambia y quita su voto", async () => {
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", 0, 1));
  assert.equal((await counts())["lionel-messi"], 1);
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", 1, -1));
  assert.equal((await counts())["lionel-messi"], -1);
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", -1, 0));
  assert.equal((await counts())["lionel-messi"], 0);
});

test("no se puede votar dos veces a la misma persona", async () => {
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", 0, 1));
  // fingir que no había voto para sumar otro +1
  await assertFails(applyVote(db("alice"), "alice", "lionel-messi", 0, 1));
  assert.equal((await counts())["lionel-messi"], 1);
});

test("varias cuentas suman cada una un voto", async () => {
  for (const u of ["u1", "u2", "u3"]) await assertSucceeds(applyVote(db(u), u, "rosalia", 0, 1));
  await assertSucceeds(applyVote(db("u4"), "u4", "rosalia", 0, -1));
  assert.equal((await counts())["rosalia"], 2);
});

test("no se puede crear el voto sin mover el marcador", async () => {
  await assertFails(setDoc(doc(db("alice"), "votes/alice_lionel-messi"),
    { uid: "alice", personId: "lionel-messi", value: 1, at: serverTimestamp() }));
});

test("no se puede mover el marcador sin votar", async () => {
  await assertFails(updateDoc(doc(db("bob"), "stats/votes"),
    new FieldPath("counts", "lionel-messi"), increment(1), "last", { uid: "bob", pid: "lionel-messi" }));
});

test("no se puede inflar el marcador con un solo voto", async () => {
  const f = db("bob"); const b = writeBatch(f);
  b.set(doc(f, "votes/bob_lionel-messi"), { uid: "bob", personId: "lionel-messi", value: 1, at: serverTimestamp() });
  b.update(doc(f, "stats/votes"), new FieldPath("counts", "lionel-messi"), increment(50), "last", { uid: "bob", pid: "lionel-messi" });
  await assertFails(b.commit());
});

test("no se puede tocar a dos personas en una sola escritura", async () => {
  const f = db("bob"); const b = writeBatch(f);
  b.set(doc(f, "votes/bob_lionel-messi"), { uid: "bob", personId: "lionel-messi", value: 1, at: serverTimestamp() });
  b.update(doc(f, "stats/votes"), new FieldPath("counts", "lionel-messi"), increment(1),
    new FieldPath("counts", "cristiano-ronaldo"), increment(-1), "last", { uid: "bob", pid: "lionel-messi" });
  await assertFails(b.commit());
});

test("no se puede votar en nombre de otra cuenta", async () => {
  await assertFails(applyVote(db("bob"), "alice", "lionel-messi", 0, 1));
});

test("no se puede borrar el voto de otra cuenta", async () => {
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", 0, 1));
  const f = db("bob"); const b = writeBatch(f);
  b.delete(doc(f, "votes/alice_lionel-messi"));
  b.update(doc(f, "stats/votes"), new FieldPath("counts", "lionel-messi"), increment(-1), "last", { uid: "bob", pid: "lionel-messi" });
  await assertFails(b.commit());
});

test("el voto no admite valores raros ni campos extra", async () => {
  const f = db("bob"); const b = writeBatch(f);
  b.set(doc(f, "votes/bob_lionel-messi"), { uid: "bob", personId: "lionel-messi", value: 5, at: serverTimestamp() });
  b.update(doc(f, "stats/votes"), new FieldPath("counts", "lionel-messi"), increment(5), "last", { uid: "bob", pid: "lionel-messi" });
  await assertFails(b.commit());
  const g = db("bob"); const c = writeBatch(g);
  c.set(doc(g, "votes/bob_lionel-messi"), { uid: "bob", personId: "lionel-messi", value: 1, at: serverTimestamp(), extra: true });
  c.update(doc(g, "stats/votes"), new FieldPath("counts", "lionel-messi"), increment(1), "last", { uid: "bob", pid: "lionel-messi" });
  await assertFails(c.commit());
});

test("nadie puede borrar ni rehacer el marcador", async () => {
  await assertFails(deleteDoc(doc(db("bob"), "stats/votes")));
  await assertFails(setDoc(doc(db("bob"), "stats/votes"), { counts: { "lionel-messi": 9999 } }));
});

// ── Privacidad ───────────────────────────────────────────────────────────────
test("cada cuenta solo lee sus votos; el marcador es público", async () => {
  await assertSucceeds(applyVote(db("alice"), "alice", "lionel-messi", 0, 1));
  await assertSucceeds(getDoc(doc(db("alice"), "votes/alice_lionel-messi")));
  await assertFails(getDoc(doc(db("bob"), "votes/alice_lionel-messi")));
  await assertSucceeds(getDoc(doc(db(null), "stats/votes")));
});

// ── Admin y sugerencias ──────────────────────────────────────────────────────
test("solo un admin añade personas y lee sugerencias", async () => {
  await assertFails(setDoc(doc(db("bob"), "extraPeople/nueva-persona"), { name: "Nueva Persona" }));
  await assertSucceeds(setDoc(doc(db("boss"), "extraPeople/nueva-persona"), { name: "Nueva Persona" }));
  await assertSucceeds(addDoc(collection(db("bob"), "pending"), { name: "Alguien", category: "Music", uid: "bob", at: serverTimestamp() }));
  await assertFails(addDoc(collection(db(null), "pending"), { name: "Alguien", category: "Music", uid: "x", at: serverTimestamp() }));
  await assertFails(getDoc(doc(db("bob"), "pending/abc")));
  await assertSucceeds(getDoc(doc(db("boss"), "pending/abc")));
  await assertFails(setDoc(doc(db("bob"), "admins/bob"), { email: "bob@example.com" }));
});

// ── Votos sin cuenta: límite de 3 ────────────────────────────────────────────
const anon = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: "anonymous" } }).firestore();
const google = uid => env.authenticatedContext(uid, { firebase: { sign_in_provider: "google.com" } }).firestore();

test("sin cuenta se puede votar a 3 personas; la cuarta pide Google", async () => {
  for (const p of ["rosalia", "quevedo", "aitana"]) await assertSucceeds(applyVote(anon("a1"), "a1", p, 0, 1));
  await assertFails(applyVote(anon("a1"), "a1", "bad-bunny", 0, 1));
  // cambiar o quitar un voto ya hecho sigue permitido
  await assertSucceeds(applyVote(anon("a1"), "a1", "rosalia", 1, -1));
  await assertSucceeds(applyVote(anon("a1"), "a1", "quevedo", 1, 0));
  // al entrar con Google (misma sesión vinculada) ya no hay límite
  await assertSucceeds(applyVote(google("a1"), "a1", "bad-bunny", 0, 1));
  const c = await counts();
  assert.equal(c["bad-bunny"], 1); assert.equal(c["rosalia"], -1); assert.equal(c["quevedo"], 0);
});

test("con Google no hay límite", async () => {
  for (const p of ["a-uno", "a-dos", "a-tres", "a-cuatro", "a-cinco"]) await assertSucceeds(applyVote(google("g1"), "g1", p, 0, 1));
});

test("no se puede trucar el contador de votos de la sesión", async () => {
  // bajar el contador para recuperar votos
  for (const p of ["rosalia", "quevedo", "aitana"]) await assertSucceeds(applyVote(anon("a2"), "a2", p, 0, 1));
  await assertFails(setDoc(doc(anon("a2"), "users/a2"), { n: 0, last: "rosalia" }));
  // votar sin sumar al contador
  const f = anon("a2"); const b = writeBatch(f);
  b.set(doc(f, "votes/a2_bad-bunny"), { uid: "a2", personId: "bad-bunny", value: 1, at: serverTimestamp() });
  b.update(doc(f, "stats/votes"), new FieldPath("counts", "bad-bunny"), increment(1), "last", { uid: "a2", pid: "bad-bunny" });
  await assertFails(b.commit());
  // tocar el contador de otra sesión
  await assertFails(setDoc(doc(anon("a3"), "users/a2"), { n: 1, last: "rosalia" }));
});

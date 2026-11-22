// Operación de voto compartida por la app y por los tests de reglas.
// Valores: 1 = sube, -1 = baja, 0 = sin voto.
import { doc, writeBatch, serverTimestamp, increment, FieldPath } from "firebase/firestore";

export const VALUE = { up: 1, down: -1 };

/** Escribe de forma atómica el voto de `uid` sobre `pid` y mueve el marcador lo justo. */
export function applyVote(db, uid, pid, current, next) {
  if (current === next) return Promise.resolve();
  const batch = writeBatch(db);
  const voteRef = doc(db, "votes", `${uid}_${pid}`);
  if (next === 0) batch.delete(voteRef);
  else batch.set(voteRef, { uid, personId: pid, value: next, at: serverTimestamp() });
  batch.update(doc(db, "stats", "votes"),
    new FieldPath("counts", pid), increment(next - current),
    "last", { uid, pid });
  return batch.commit();
}

/** Siguiente estado al pulsar una flecha: misma flecha quita el voto, la otra lo cambia. */
export function nextValue(current, dir) {
  const v = VALUE[dir];
  return current === v ? 0 : v;
}

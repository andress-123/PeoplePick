# Base de datos de PeoplePick (v2 · noviembre 2026)

Todo es de personas. Dos archivos:

- `people.json`: cada persona con `id` (fijo, sale del nombre), `name`, `category`, `country`, `sub` (una línea de contexto: club, cargo, obra), `tags`, `events` (en qué eventos aparece) y `wiki` (título exacto en Wikipedia, para que la foto sea siempre la correcta).
- `events.json`: grupos de votación. Cada evento tiene `title` / `titleEs`, `question` / `questionEs`, `type` (election, season, award, versus, goat, poll), `status` (live, upcoming, evergreen), `mode` (ranking o versus), `heat` (1-3, cuánto empujarlo en portada), `featured`, fechas opcionales y la lista `people` (ids).

## Cómo la usa la app

La app lee las personas y los eventos directamente de estos archivos (no hace falta cargarlos en Firestore). En Firestore solo viven los votos (`votes`), el marcador (`stats/votes`), las personas añadidas desde el panel (`extraPeople`) y las ocultadas (`config/people`). Ver `ACTIVAR.md`.

## Criterio editorial

Fuera de la base, a propósito:

- Bandas y grupos (The Beatles, BTS, Coldplay…): la app es de personas, así que están sus miembros (Lennon, McCartney, Jungkook, Chris Martin…).
- Responsables de genocidios o dictaduras con represión masiva (Hitler, Stalin, Mussolini, Mao, Franco, Kim Jong-un): no tiene sentido que suban en un ranking de "a quién admiras".
- Profetas y figuras religiosas fundacionales (Jesús, Mahoma, Moisés, Buda): la foto sale de Wikipedia y una imagen de Mahoma sería un problema serio.
- Personas cuya fama hoy se asocia sobre todo a acusaciones graves (Woody Allen, David Dobrik).

Si quieres recuperar alguno, añádelo a mano en `people.json`.

## Fechas y datos de actualidad

Los datos de actualidad (plantillas, entrenadores, candidatos, nominados) están comprobados a 22 de noviembre de 2026. Cuando cambien (mercado de invierno, nominaciones a los Óscar en enero, resultados del 29N), hay que actualizar `sub`, `tags` y los eventos afectados.

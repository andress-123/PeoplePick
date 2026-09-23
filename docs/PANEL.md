# Especificación: Mesa de redacción de Poka Yoke

Panel privado en `/panel` para que Andrew cure el magazine: aprueba o descarta temas, revisa borradores, escribe su "Por qué importa" y publica. Todo sin usar la API de Anthropic: la parte de IA la hacen **rutinas de Claude Code** (claude.ai/code/routines), que consumen de la suscripción de Andrew.

El diseño aprobado está en `docs/diseno-panel/` (tres pantallas en HTML con estilos en línea). Reprodúcelo fielmente: fondo `#F3F3F1`, tarjetas blancas con borde `#E4E4E0` y radio 16 px, píldoras con radio 999 px, contadores en círculo negro, botones en píldora, Schibsted Grotesk. En móvil, una sección cada vez con pestañas en píldora.

## Principios

- GitHub es la base de datos. El panel no tiene base de datos propia: lee y escribe en el repositorio mediante la API de GitHub.
- La web pública sigue siendo estática. Solo las rutas del panel se ejecutan en servidor.
- Todas las claves viven en variables de entorno de Vercel y solo se usan en el servidor. Nunca llegan al navegador.
- Si las rutinas fallan o cambian, el panel sigue funcionando para revisar y publicar.

## Arquitectura

- Añade el adaptador `@astrojs/vercel`. Mantén todas las páginas públicas prerenderizadas; las del panel y sus endpoints llevan `export const prerender = false`.
- Rutas:
  - `/panel/entrar`: formulario de contraseña.
  - `/panel`: la mesa de redacción (cuatro columnas en escritorio, pestañas en móvil).
  - `/api/panel/*`: acciones (aprobar, descartar, publicar, buscar ahora, salir).
- Middleware que protege `/panel` y `/api/panel`: si no hay sesión válida, redirige a `/panel/entrar` (o responde 401 en la API).
- Sesión: cookie `httpOnly`, `secure`, `sameSite=strict`, firmada con HMAC usando `PANEL_SECRET`, caducidad de 30 días. Limita los intentos de contraseña (por ejemplo, 5 por hora y dirección IP).
- Añade `<meta name="robots" content="noindex">` a todo el panel y exclúyelo del RSS y de cualquier sitemap.

## Variables de entorno (Vercel, entorno Production)

| Variable | Qué es |
|---|---|
| `PANEL_PASSWORD` | Contraseña de Andrew para entrar al panel |
| `PANEL_SECRET` | Cadena aleatoria larga para firmar la cookie |
| `GITHUB_TOKEN` | Token fine-grained de GitHub, solo para el repositorio pokayoke, con permisos de lectura y escritura en Contents y Pull requests, y lectura en Commit statuses y Deployments |
| `GITHUB_REPO` | `usuario/pokayoke` |
| `RUTINA_RADAR_URL` y `RUTINA_RADAR_TOKEN` | Endpoint y token del disparador API de la rutina "Radar" |
| `RUTINA_REDACTAR_URL` y `RUTINA_REDACTAR_TOKEN` | Endpoint y token del disparador API de la rutina "Redactar" |

Si faltan las variables de las rutinas, los botones que las usan deben mostrar un aviso claro en vez de fallar.

## Datos

### Propuestas del radar

Viven en la rama `datos-radar`, archivo `radar/propuestas.json`, para no generar despliegues en producción cada vez que hay radar. Es una lista de objetos:

```json
{
  "id": "2026-09-25-instagram-rediseno",
  "fecha": "2026-09-25",
  "titular": "Instagram hace su primer gran rediseño en más de diez años",
  "categoria": "branding",
  "resumen": "Qué ha pasado, en dos frases.",
  "angulo": "Por qué le interesaría a cualquiera.",
  "fuente": { "nombre": "It's Nice That", "url": "https://..." },
  "cobertura": [{ "nombre": "...", "url": "https://..." }],
  "imagenes": true,
  "imagenUrl": "https://... (miniatura opcional)",
  "estado": "nueva",
  "sesionUrl": null,
  "pr": null
}
```

`estado` puede ser `nueva`, `aprobada`, `descartada` o `redactada`. El panel solo modifica `estado` y `sesionUrl`. Guarda los cambios con la API de contenidos de GitHub, usando el `sha` del archivo para no pisar cambios simultáneos (si hay conflicto, vuelve a leer y reintenta una vez).

### Artículos en revisión

Son los Pull Requests abiertos con la etiqueta `articulo`. Para cada uno:

- Lee `src/content/articulos/<slug>/index.md` de la rama del PR y calcula la lista de comprobación: fuentes presentes, todas las imágenes con texto alternativo y sin `PENDIENTE`, ficha sin `PENDIENTE`, créditos, y si falta `porQueImporta`.
- Obtén la URL de la vista previa desde los despliegues de GitHub del último commit del PR (entorno Preview de Vercel).
- Muestra portada (desde la vista previa), categoría, titular y hace cuánto se abrió.

### Portada (destacados)

La elección de destacados vive en `src/content/portada.json`, en `main`:

```json
{ "destacado1": "slug-del-articulo", "destacado2": "slug-del-articulo" }
```

- `destacado1` es el artículo grande de arriba de la home; `destacado2`, el de la imagen a sangre de la mitad.
- Sustituye al campo `destacado` del frontmatter: elimínalo del esquema y de los artículos.
- Si un valor está vacío, apunta a un artículo que no existe o a un borrador, se usa el artículo publicado más reciente que no esté ya elegido. Si los dos apuntan al mismo, el segundo se trata como vacío.

**Cambios en la home** (`src/pages/index.astro`):

- Los dos destacados salen en sus huecos y **no se repiten en ningún otro sitio de la home**.
- El resto de artículos sale por orden de publicación, del más reciente al más antiguo: los tres primeros en "Últimos" y los cinco siguientes en la lista numerada.
- Mientras no haya datos reales de visitas, esa lista numerada se titula "Más artículos" en lugar de "Lo más leído", para no afirmar algo que no se mide. Si en `src/config.ts` hay una lista `masLeidos`, se usa esa y se titula "Lo más leído", excluyendo igualmente los destacados.
- Ningún artículo aparece dos veces en la home.

### Publicados

Artículos de `src/content/articulos/` en `main` con `borrador: false`, ordenados por fecha, con enlace a la web pública.

## Acciones

- **Sí, redactar**: pasa la propuesta a `aprobada` y llama a la rutina "Redactar" (POST a `RUTINA_REDACTAR_URL` con `Authorization: Bearer RUTINA_REDACTAR_TOKEN`, cabeceras `anthropic-beta: experimental-cc-routine-2026-04-01` y `anthropic-version: 2023-06-01`, y cuerpo `{"text": <JSON de la propuesta>}`). Guarda en `sesionUrl` la URL de sesión que devuelve. La tarjeta pasa a "En preparación" con enlace a esa sesión.
- **No**: pasa la propuesta a `descartada`.
- **Guardar portada** (tarjeta "Portada", ver el diseño): dos selectores con los artículos publicados, cada uno con miniatura y titular. Al guardar, el panel escribe `src/content/portada.json` en `main` con un commit ("Portada: <titular 1> / <titular 2>"). Vercel redespliega y la home cambia en uno o dos minutos; muestra ese aviso tras guardar. No permitas elegir el mismo artículo en los dos huecos. En móvil, la portada es una pestaña más.
- **Buscar temas ahora**: llama a la rutina "Radar" del mismo modo, sin texto.
- **Publicar**:
  1. Valida que el texto tiene al menos 40 caracteres.
  2. En la rama del PR, escribe el texto en `porQueImporta` y cambia `borrador: true` por `borrador: false`, en un único commit.
  3. Espera a que el estado del commit (checks de Vercel) sea correcto, mostrando "Comprobando…" en la tarjeta.
  4. Si la comprobación falla, muestra el motivo y no publiques.
  5. Si pasa, fusiona el PR (squash) y mueve la tarjeta a "Publicados".
- **Pedir cambios** (fase C): campo de texto; llama a la rutina "Redactar" indicando el PR y los cambios pedidos.
- **Pulir mi texto antes de publicar** (fase C): si está marcado, en lugar de escribir el texto tal cual, llama a una rutina "Pulir" que lo corrige sin cambiar la opinión, lo guarda en el PR y deja la tarjeta lista para pulsar Publicar. Hasta la fase C, oculta esta casilla.

## Microanimaciones

Aplícalas a la web pública y al panel. Criterios: rápidas, discretas, sin rebotes ni efectos llamativos. Todo se desactiva con `prefers-reduced-motion: reduce`.

**Web pública**
- Enlaces del menú y del pie: una línea fina que crece de izquierda a derecha al pasar el ratón (`transform: scaleX`, 200 ms, ease-out) en lugar del subrayado actual. La sección activa la mantiene visible.
- Tarjetas de artículo y destacados: la imagen hace un zoom mínimo (`scale(1.02)`, 600 ms, ease-out) dentro de su marco, sin desbordarse. El titular recibe la misma línea que el menú.
- Botones (Suscribirme, filtros, compartir): transición de color de 150 ms y, al hacer clic, se hunden un pelo (`scale(0.98)`).
- Filtros de categoría y botones de compartir: el relleno negro entra con una transición de 150 ms.
- Imágenes: fundido de entrada al cargar (opacidad de 0 a 1, 400 ms).

**Panel**
- Tarjetas: al pasar el ratón, el borde pasa de `#E4E4E0` a `#000000` (150 ms). Sin sombras ni desplazamientos.
- Botones en píldora: mismo hundimiento al clic (`scale(0.98)`) y transición de color de 150 ms.
- Al aprobar, descartar o publicar, la tarjeta se desvanece y encoge ligeramente (opacidad a 0 y `scale(0.98)`, 200 ms) antes de desaparecer de su columna, y aparece en la siguiente con un fundido de 200 ms.
- Contadores en burbuja: cuando cambian, el número hace un fundido rápido (150 ms).
- Estados de espera ("Comprobando…", "Redactando"): el punto negro late suavemente (opacidad entre 1 y 0,4, ciclo de 1,6 s).
- Selectores de la tarjeta Portada: al cambiar de artículo, la miniatura y el titular hacen un fundido cruzado de 200 ms.

## Rutinas (las crea Andrew en claude.ai/code/routines)

Todas con el repositorio pokayoke y un entorno con acceso a internet **Full**.

1. **Radar**: disparador por horario (lunes, miércoles y viernes a las 9:00) y disparador API. Instrucciones: ejecutar el flujo de `.claude/commands/radar.md` y añadir los candidatos a `radar/propuestas.json` en la rama `datos-radar` (creándola si no existe), sin duplicar temas ya propuestos, publicados o descartados, y conservando solo las últimas 8 semanas.
2. **Redactar**: disparador API. Instrucciones: leer la propuesta del bloque de datos recibido, ejecutar el flujo de `.claude/commands/articulo.md` con su fuente, abrir el PR con la etiqueta `articulo`, poner en la descripción la línea `Propuesta: <id>` y marcar la propuesta como `redactada` con el número de PR en `datos-radar`.

Actualiza `.claude/commands/radar.md` para que, además de mostrar la lista, escriba en ese formato JSON.

## Fases de construcción

- **Fase A**: adaptador, autenticación, diseño del panel, lectura de las fuentes de datos, Sí/No (solo cambio de estado), Publicar, la tarjeta Portada con los cambios de la home, y las microanimaciones de la web y del panel. Con esto el panel ya es útil: las propuestas aprobadas se pueden redactar lanzando `/articulo` a mano.
- **Fase B**: conexión con las rutinas (Sí dispara "Redactar", "Buscar temas ahora" dispara "Radar", enlaces a las sesiones).
- **Fase C**: Pedir cambios y Pulir.

Cada fase, en su propio Pull Request, con `npm run build` sin errores y una nota en `EMPEZAR.md` explicando cómo configurar lo nuevo.

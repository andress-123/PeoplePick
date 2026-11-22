# Activar PeoplePick: votos reales y bot de tendencias

**Cómo se vota:** cualquiera vota a 3 personas sin cuenta, al instante. Para votar a más, entra con Google y conserva lo que ya votó. Cada sesión o cuenta tiene un solo voto por persona; cambiarlo o quitarlo no gasta. El límite lo aplican las reglas de Firestore, así que no se salta desde fuera de la web.

Hazlo en este orden. Son unos 30 minutos la primera vez.

## 1. Firebase (votos reales, un voto por cuenta)

1. **Firestore.** En [console.firebase.google.com](https://console.firebase.google.com) abre el proyecto `peoplepick-d8937` → *Firestore Database*. Si no existe, créala en modo producción, ubicación `eur3`.
2. **Acceso.** *Authentication* → *Sign-in method* → activa **Anónimo** (para los 3 primeros votos sin cuenta) y **Google** (para seguir votando). En *Settings → Authorized domains* añade `people-pick-lsy9.vercel.app` (y tu dominio propio si lo tienes).
3. **Reglas.** En la terminal, dentro del proyecto:
   ```bash
   npx firebase login
   npx firebase deploy --only firestore:rules
   ```
4. **Marcador inicial.** Descarga la clave de servicio (*Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada*), guárdala como `serviceAccountKey.json` en la raíz (nunca la subas a GitHub; ya está en `.gitignore`) y ejecuta:
   ```bash
   node scripts/setup-firestore.js
   ```
5. **Variables en Vercel.** *Project → Settings → Environment Variables*: añade las seis `VITE_FIREBASE_*` (las mismas de tu `.env.local`). Copia también el `.env.local` a esta carpeta para probar en local.
6. **Tu cuenta de admin.** En la web, pulsa "Guardar mis votos con Google" en el pie (aparece tras votar) y entra con tu cuenta. Luego:
   ```bash
   node scripts/setup-firestore.js --admin tu@gmail.com
   ```
   Al recargar verás *Admin* en el pie.

**Opcional, recomendado cuando haya tráfico: App Check.** Bloquea scripts que no vienen de tu web. Crea una clave reCAPTCHA v3 en Firebase (*App Check → Registrar app web*), añade `VITE_RECAPTCHA_SITE_KEY` en Vercel y, tras unos días en modo monitorización, pulsa *Enforce* para Firestore.

**Comprobación automática.** Cada vez que cambien las reglas, GitHub ejecuta 17 pruebas que intentan votar dos veces, inflar el marcador, votar por otro, pasarse del límite sin cuenta o trucar el contador. Tienen que salir en verde (pestaña *Actions → Reglas de Firestore*).

## 2. Bot de tendencias (simulación)

No necesita nada para empezar: en cuanto esto esté en `main`, GitHub lo ejecuta cada hora de 8 a 23 h en **modo simulación**. En cada ejecución:

- *Actions → Bot de tendencias → la ejecución* muestra el resumen: propuestas con imagen y textos, descartes con su motivo y todas las tendencias revisadas.
- La rama `bot-preview` guarda las imágenes y `preview.html` de la última pasada.
- Para ver tarjetas de quien quieras: *Actions → Bot de tendencias → Run workflow* y escribe ids en "demo" (por ejemplo `rosalia,pedro-sanchez`).

Ajustes en `bot/config.js`: días sin repetir persona, máximo al día, palabras sensibles y cifra mínima para enseñar votos.

## 3. Pasar el bot a activo (te llega todo a Telegram)

1. En Telegram habla con **@BotFather** → `/newbot` → guarda el *token*.
2. Escribe cualquier cosa a tu bot nuevo y abre `https://api.telegram.org/bot<TOKEN>/getUpdates`: el número de `chat.id` es tu *chat id*.
3. En GitHub → *Settings → Secrets and variables → Actions*:
   - *Secrets*: `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
   - *Variables*: `BOT_MODE` = `activo` (y `SITE_URL` si cambias de dominio).

Desde ese momento, cuando haya una oportunidad te llega la imagen con el tuit y, debajo, la respuesta con el enlace. Publicas el tuit con la imagen, esperas unos minutos y respondes con el enlace. El bot recuerda a quién ha propuesto para no repetir.

**Por qué no publica solo:** las normas de X prohíben publicar de forma automática sobre temas que son tendencia, y la API de X ya no es gratuita (un tuit con enlace cuesta 0,20 $). Publicando tú es gratis y no arriesgas la cuenta.

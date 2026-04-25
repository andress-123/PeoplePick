# 🚀 PeoplePick — Deploy completo paso a paso

## Tiempo estimado: ~20 minutos

---

## PASO 1 — Crear proyecto en Firebase

1. Ve a https://console.firebase.google.com
2. Clic en **"Agregar proyecto"**
3. Nombre: `peoplepick` → Continuar → Crear proyecto
4. En el menú lateral: **Firestore Database** → Crear base de datos
   - Modo: **Producción** (usaremos las reglas del archivo `firestore.rules`)
   - Ubicación: `eur3 (Europe)` o la más cercana a tu audiencia
5. En el menú lateral: **Authentication** → NO necesitas activarlo (usamos fingerprint sin auth)

---

## PASO 2 — Obtener la config de Firebase

1. En Firebase Console → ⚙️ **Project Settings** → pestaña **General**
2. Scroll hasta "Tus apps" → clic en el icono **`</>`** (Web)
3. Nombre de la app: `peoplepick-web` → Registrar app
4. Copia el objeto `firebaseConfig` que aparece:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "peoplepick.firebaseapp.com",
  projectId: "peoplepick",
  storageBucket: "peoplepick.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...",
};
```

5. **Pega estos valores** en `src/App.jsx` reemplazando los `"REPLACE_..."`:

```js
const firebaseConfig = {
  apiKey:            "AIza...",       // ← tu valor real
  authDomain:        "...",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "...",
};
```

6. También cambia la contraseña del admin (línea ~20 de App.jsx):
```js
const ADMIN_PASSWORD = "tu_contraseña_segura";
```

---

## PASO 3 — Aplicar reglas de Firestore

1. En Firebase Console → **Firestore** → pestaña **Reglas**
2. Borra el contenido actual y pega el contenido de `firestore.rules`
3. Clic en **Publicar**

---

## PASO 4 — Poblar Firestore con los datos iniciales (seed)

1. En Firebase Console → ⚙️ **Project Settings** → **Cuentas de servicio**
2. Clic en **"Generar nueva clave privada"** → guarda el archivo como `serviceAccountKey.json`
3. Coloca `serviceAccountKey.json` en la raíz del proyecto (al lado de `seed.js`)
4. Instala firebase-admin y ejecuta el seed:

```bash
npm install firebase-admin
node seed.js
```

5. Verás: `✅ Done!` — ya tienes las personas en Firestore
6. **Borra `serviceAccountKey.json`** — nunca lo subas a git

---

## PASO 5 — Instalar dependencias y probar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 — deberías ver el ranking con datos reales de Firebase.

---

## PASO 6 — Subir el código a GitHub

1. Crea un repo en https://github.com/new (puede ser privado)
2. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "PeoplePick v1"
git remote add origin https://github.com/TU_USUARIO/peoplepick.git
git push -u origin main
```

> ⚠️ Asegúrate de que `serviceAccountKey.json` esté en `.gitignore` — añade esta línea:
> ```
> serviceAccountKey.json
> ```

---

## PASO 7 — Deploy en Vercel (gratis)

1. Ve a https://vercel.com → Sign up con tu cuenta de GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repo `peoplepick`
4. Configuración automática detecta Vite → clic en **Deploy**
5. En ~2 minutos tendrás tu URL: `https://peoplepick.vercel.app`

---

## PASO 8 — Dominio personalizado (opcional)

En Vercel → tu proyecto → **Settings → Domains** → añade tu dominio.

---

## 🔐 Panel de administrador

- Accede desde la app: clic en el icono 🛡️ en el navbar
- Contraseña: la que definiste en `ADMIN_PASSWORD`
- Desde el panel puedes:
  - **Añadir personas** directamente al ranking
  - **Aprobar o rechazar** sugerencias del público

---

## 🏗️ Arquitectura de Firestore

```
/people/{id}          → personas aprobadas en el ranking
  name: string
  category: string
  votes: number
  createdAt: timestamp

/votes/{fp_personId}  → un documento por voto
  fp: string          → fingerprint del dispositivo
  personId: string
  type: "up" | "down"
  createdAt: timestamp

/pending/{id}         → sugerencias pendientes de aprobación
  name: string
  category: string
  fp: string
  submittedAt: timestamp
```

---

## ❓ Preguntas frecuentes

**¿Es seguro el fingerprint?**
Es suficiente para un experimento social. Un usuario técnico podría saltárselo, pero el 99% de usuarios no lo hará. Si quieres más robustez, añade Google Auth en el futuro.

**¿Cuánto cuesta Firebase?**
El plan gratuito (Spark) aguanta perfectamente hasta ~50k lecturas/día. Para una app con tráfico real, el plan Blaze (pay-as-you-go) es muy barato.

**¿Cómo actualizo el código?**
`git push` → Vercel redeploya automáticamente en ~1 minuto.

// Conexión con Firebase.
// La configuración web de Firebase NO es secreta: identifica el proyecto y viaja igualmente
// en el JavaScript público de la web. La seguridad la dan las reglas de Firestore (firestore.rules)
// y los dominios autorizados de Authentication. Por eso va aquí por defecto; las variables
// VITE_FIREBASE_* (si existen en .env.local o en Vercel) la sustituyen, p. ej. para otro proyecto.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const env = import.meta.env;
const PUBLIC_CONFIG = {
  apiKey:            "AIzaSyCjWr7SdUbqTkcgvbkb2XpaRYqBFpiACVM",
  authDomain:        "peoplepick-d8937.firebaseapp.com",
  projectId:         "peoplepick-d8937",
  storageBucket:     "peoplepick-d8937.firebasestorage.app",
  messagingSenderId: "1053223535870",
  appId:             "1:1053223535870:web:65df242df365f693d2d1af",
};
const config = {
  apiKey:            env.VITE_FIREBASE_API_KEY             || PUBLIC_CONFIG.apiKey,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN         || PUBLIC_CONFIG.authDomain,
  projectId:         env.VITE_FIREBASE_PROJECT_ID          || PUBLIC_CONFIG.projectId,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET      || PUBLIC_CONFIG.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || PUBLIC_CONFIG.messagingSenderId,
  appId:             env.VITE_FIREBASE_APP_ID              || PUBLIC_CONFIG.appId,
};

export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

export const app  = firebaseReady ? initializeApp(config) : null;
export const db   = firebaseReady ? getFirestore(app) : null;
export const auth = firebaseReady ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// App Check (opcional, recomendado): bloquea scripts y bots que no vienen de la web real.
// Se activa poniendo VITE_RECAPTCHA_SITE_KEY y marcando "Enforce" en la consola de Firebase.
if (firebaseReady && env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

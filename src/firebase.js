// Conexión con Firebase. Los valores vienen de las variables VITE_FIREBASE_* (.env.local en tu
// ordenador y Environment Variables en Vercel). Si faltan, la app funciona en modo lectura.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const env = import.meta.env;
const config = {
  apiKey:            env.VITE_FIREBASE_API_KEY,
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.VITE_FIREBASE_APP_ID,
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

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

export const isFirebaseConfigured =
  !!apiKey && !!authDomain && !!projectId && !!storageBucket && !!messagingSenderId && !!appId;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (isFirebaseConfigured) {
  // Reuse existing Firebase app (survives Vite HMR hot reloads)
  if (getApps().length === 0) {
    app = initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });

    // Force HTTP long-polling — WebSockets are unreliable in proxied environments
    // (Replit, Codespaces, etc.) and cause 30+ second delays on first query.
    //
    // Use memoryLocalCache to DISABLE IndexedDB offline persistence.
    // With IndexedDB, batch.commit() can resolve locally before actually reaching
    // the server — so the data appears written but is never persisted to Firestore.
    // memoryLocalCache ensures all reads/writes go directly to the server.
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: memoryLocalCache(),
    });

    console.log("[Firebase] ✅ Inicializado (long-polling mode)");
  } else {
    app = getApp();
    db = getFirestore(app);
    console.log("[Firebase] ♻️ Reutilizando instância existente");
  }

  auth = getAuth(app);
  storage = getStorage(app);
} else {
  const missing = [
    !apiKey && "VITE_FIREBASE_API_KEY",
    !authDomain && "VITE_FIREBASE_AUTH_DOMAIN",
    !projectId && "VITE_FIREBASE_PROJECT_ID",
    !storageBucket && "VITE_FIREBASE_STORAGE_BUCKET",
    !messagingSenderId && "VITE_FIREBASE_MESSAGING_SENDER_ID",
    !appId && "VITE_FIREBASE_APP_ID",
  ].filter(Boolean);
  console.error("[Firebase] ❌ Variáveis ausentes:", missing.join(", "));
}

export { auth, db, storage };
export default app!;

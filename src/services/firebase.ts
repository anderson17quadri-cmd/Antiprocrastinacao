/**
 * Inicialização do Firebase (Auth + Firestore).
 *
 * As credenciais vêm de variáveis de ambiente públicas do Expo
 * (EXPO_PUBLIC_FIREBASE_*). Sem elas o app funciona 100% offline,
 * em modo local — a sincronização em tempo real é ativada
 * automaticamente quando o projeto é configurado.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initialized = false;

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

function ensureInit(): void {
  if (initialized || !isFirebaseConfigured()) return;
  initialized = true;
  // Imports síncronos via require para evitar custo quando não configurado.
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { initializeApp, getApps } = require('firebase/app');
  const firebaseAuthModule = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  /* eslint-enable @typescript-eslint/no-var-requires */

  app = getApps().length ? getApps()[0] : initializeApp(config);
  try {
    // Persistência de sessão no React Native via AsyncStorage.
    auth = firebaseAuthModule.initializeAuth(app, {
      persistence: firebaseAuthModule.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = firebaseAuthModule.getAuth(app);
  }
  db = getFirestore(app!);
}

export function firebaseApp(): FirebaseApp | null {
  ensureInit();
  return app;
}

export function firebaseAuth(): Auth | null {
  ensureInit();
  return auth;
}

export function firestore(): Firestore | null {
  ensureInit();
  return db;
}

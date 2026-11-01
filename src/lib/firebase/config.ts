import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBZKgOjATklotjcWzerD5tqPvODNkqJByw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fretebela.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fretebela",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fretebela.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "318460639332",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:318460639332:web:8cce5374ce025eee290771",
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }
} else {
  app = getApp();
  db = getFirestore(app);
}

if (typeof window !== 'undefined') {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.warn("Firebase auth initialization warning:", error);
    auth = {} as Auth;
  }
} else {
  auth = {} as Auth;
}

export { app, auth, db };

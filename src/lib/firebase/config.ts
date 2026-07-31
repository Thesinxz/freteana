import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

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
let messaging: Messaging | null = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // Enable offline persistence with modern API
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    db = getFirestore(app);
  }
} else {
  app = getApp();
  db = getFirestore(app);
}

try {
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase auth not initialized due to missing/invalid API key:", error);
  auth = {} as Auth;
}

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn("FCM messaging init error:", e);
      }
    }
  });
}

export { app, auth, db, messaging };

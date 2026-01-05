// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCCxQ0AYTHy6A6DrfW7ylYxjGW6AZA1OQ",
  authDomain: "whatsappclone-5ad8f.firebaseapp.com",
  projectId: "whatsappclone-5ad8f",
  storageBucket: "whatsappclone-5ad8f.firebasestorage.app",
  messagingSenderId: "1049878222012",
  appId: "1:1049878222012:web:54584a8098728e70acecb9"
};

// 1. Initialize App (Singleton Pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Auth
export const auth = getAuth(app);

// 3. Initialize Firestore with Persistence
// We check if 'window' is defined to ensure this only runs on the client
let dbInstance;

if (typeof window !== "undefined") {
  // Initialize standard Firestore
  dbInstance = getFirestore(app);

  // Enable Offline Persistence
  // enableMultiTabIndexedDbPersistence is better than enableIndexedDbPersistence
  // because it allows multiple tabs to work together without crashing.
  enableMultiTabIndexedDbPersistence(dbInstance).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open too early.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by this browser.');
    }
  });
} else {
  // Fallback for Server Side Rendering (SSR)
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
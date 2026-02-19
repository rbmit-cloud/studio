'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (getApps().length > 0) {
      const app = getApp();
      const auth = getAuth(app);
      const firestore = getFirestore(app);
      return { app, auth, firestore };
    } else {
      try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore };
      } catch (e) {
        console.error('Failed to initialize firebase', e);
        return { app: null, auth: null, firestore: null };
      }
    }
  }
  return { app: null, auth: null, firestore: null };
}

export { initializeFirebase };

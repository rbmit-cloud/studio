'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    // A valid apiKey is required for Auth. If it's not present, we can't initialize Auth.
    const canInitializeAuth = !!firebaseConfig.apiKey;

    if (getApps().length > 0) {
      const app = getApp();
      const auth = canInitializeAuth ? getAuth(app) : null;
      const firestore = getFirestore(app);
      return { app, auth, firestore };
    } else {
      try {
        const app = initializeApp(firebaseConfig);
        const auth = canInitializeAuth ? getAuth(app) : null;
        const firestore = getFirestore(app);
        return { app, auth, firestore };
      } catch (e) {
        // This will catch if initializeApp itself fails due to bad config.
        console.error('Failed to initialize Firebase app', e);
        return { app: null, auth: null, firestore: null };
      }
    }
  }
  return { app: null, auth: null, firestore: null };
}

export { initializeFirebase };

'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!app) { // Only initialize once
      try {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const canInitializeAuth = !!firebaseConfig.apiKey;
        auth = canInitializeAuth ? getAuth(app) : null;
        firestore = getFirestore(app);
      } catch (e) {
        console.error('Failed to initialize Firebase app', e);
        // Reset so we can try again if needed
        app = null;
        auth = null;
        firestore = null;
      }
    }
  }
  return { app, auth, firestore };
}

export { initializeFirebase };

'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';

// This function will be called from the provider, which is a client component.
// It's safe to assume this runs on the client.
function initializeFirebase() {
  try {
    // If the config is missing, don't initialize Firebase.
    if (!firebaseConfig.projectId) {
      console.error("Firebase config is missing or incomplete. Please check your environment variables. The application will not connect to Firebase.");
      return { app: null, auth: null, firestore: null };
    }

    // Check if Firebase has already been initialized.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    // Get auth and firestore instances.
    // We check for apiKey to avoid "invalid-api-key" error when auth is not configured.
    const canInitializeAuth = !!firebaseConfig.apiKey;
    const auth = canInitializeAuth ? getAuth(app) : null;
    const firestore = getFirestore(app);

    return { app, auth, firestore };
  } catch (e) {
      console.error('Failed to initialize Firebase app', e);
      // Return nulls if initialization fails
      return { app: null, auth: null, firestore: null };
  }
}

export { initializeFirebase };

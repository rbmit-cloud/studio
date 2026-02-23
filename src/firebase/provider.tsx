'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useToast } from '@/hooks/use-toast';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
});

export default function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextType>({
    app: null,
    auth: null,
    firestore: null,
  });
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the config is valid before doing anything.
    if (!firebaseConfig?.projectId) {
      const errorMessage = "Configuración de Firebase incompleta. Revisa las variables de entorno.";
      console.error(errorMessage);
      setError(errorMessage);
      return;
    }

    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);

      setFirebase({ app, auth, firestore });
      console.log('✅ Conectado correctamente al proyecto de Firebase:', app.options.projectId);
      
    } catch (e: any) {
      const errorMessage = `Fallo al inicializar Firebase: ${e.message}`;
      console.error(errorMessage, e);
      setError(errorMessage);
    }
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="w-full max-w-md rounded-lg border border-destructive bg-card p-6 text-center">
          <h1 className="text-2xl font-bold text-destructive">Error de Configuración</h1>
          <p className="mt-4 text-card-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">La aplicación no puede funcionar sin una conexión válida a Firebase.</p>
        </div>
      </div>
    );
  }

  if (!firebase.app) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Conectando con Firebase...</p>
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

export const useFirebaseApp = () => {
  const { app } = useFirebase();
  return app;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.');
  }
  return firestore;
};

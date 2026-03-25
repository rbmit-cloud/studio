'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, orderBy, limit, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Visitor } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

const SERVICE_APP_NAME = 'firebase-service-app';

async function getAuthenticatedFirestore(): Promise<Firestore> {
    const apps = getApps();
    const serviceApp = apps.find(app => app.name === SERVICE_APP_NAME) 
                     || initializeApp(firebaseConfig, SERVICE_APP_NAME);

    const auth = getAuth(serviceApp);

    if (auth.currentUser?.email !== process.env.FIREBASE_SERVICE_EMAIL) {
        if (!process.env.FIREBASE_SERVICE_EMAIL || !process.env.FIREBASE_SERVICE_PASSWORD) {
            throw new Error("Las credenciales de la cuenta de servicio de Firebase no están configuradas.");
        }
        await signInWithEmailAndPassword(auth, process.env.FIREBASE_SERVICE_EMAIL, process.env.FIREBASE_SERVICE_PASSWORD);
    }
    
    return getFirestore(serviceApp);
}

type PreviousVisitPayload = {
    visitorName: string;
    entryType: 'Personal' | 'Transportista';
    environment: 'prod' | 'test';
};

// Define a return type that is serializable for the client
type PreviousVisitResult = {
    companyName?: string;
    hostName?: string;
    department?: string;
    licensePlate?: string;
} | null;


export async function findPreviousVisitAction(payload: PreviousVisitPayload): Promise<{ success: boolean; data: PreviousVisitResult, message?: string }> {
    if (!process.env.FIREBASE_SERVICE_EMAIL || !process.env.FIREBASE_SERVICE_PASSWORD) {
        return { success: false, data: null, message: 'Las credenciales de la cuenta de servicio de Firebase no están configuradas.' };
    }

    try {
        const db = await getAuthenticatedFirestore();
        const visitsCollectionName = payload.environment === 'test' ? 'test_visits' : 'visits';

        const q = query(
            collection(db, visitsCollectionName),
            where("visitorName", "==", payload.visitorName),
            where("entryType", "==", payload.entryType),
            orderBy("entryDateTime", "desc"),
            limit(1)
        );
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: true, data: null };
        }

        const lastVisit = querySnapshot.docs[0].data() as Visitor;

        const result: PreviousVisitResult = {
            companyName: lastVisit.companyName,
            hostName: lastVisit.hostName,
            department: lastVisit.department,
            licensePlate: lastVisit.vehicleDetails?.licensePlate,
        };

        return { success: true, data: result };

    } catch (error: any) {
        console.error('Error finding previous visit:', error);
        
        if (error instanceof FirebaseError) {
             if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                return { success: false, data: null, message: 'Error de autenticación con la cuenta de servicio de Firebase. Verifique las variables de entorno FIREBASE_SERVICE_EMAIL y FIREBASE_SERVICE_PASSWORD. Si cambió la contraseña de este usuario recientemente, debe actualizarla aquí también.' };
             }
             if (error.code === 'firestore/failed-precondition') {
                // The original error message from Firestore contains the URL to create the index.
                // It's important to pass this full message to the client.
                return { success: false, data: null, message: error.message };
             }
        }
        
        return { success: false, data: null, message: error.message || 'No se pudo buscar la visita anterior.' };
    }
}

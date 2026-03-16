'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, type Firestore } from 'firebase/firestore';
import * as nodemailer from 'nodemailer';
import { firebaseConfig } from '@/firebase/config';
import type { Host, Visitor, VehicleDetails } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

// Define a constant for our service app's name to avoid conflicts
const SERVICE_APP_NAME = 'firebase-service-app-entry-notification';

/**
 * Initializes a dedicated Firebase app for the service account,
 * signs it in, and returns an authenticated Firestore instance.
 * This function is idempotent, meaning it won't create multiple app instances.
 */
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

type VisitorNotificationPayload = {
    entryType: 'Personal' | 'Transportista';
    visitorName: string;
    companyName: string;
    purposeOfVisit: string;
    hostName: string;
    department?: string;
    vehicleDetails?: VehicleDetails;
    environment: 'prod' | 'test';
};

export async function sendEntryNotificationEmail(visitor: VisitorNotificationPayload): Promise<{ success: boolean; message: string }> {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return { success: false, message: 'Las credenciales de Gmail no están configuradas en las variables de entorno.' };
    }

    if (!visitor.hostName) {
        return { success: true, message: 'No se ha especificado un anfitrión. No se enviará notificación.' };
    }

    try {
        const db = await getAuthenticatedFirestore();
        const hostsCollectionName = visitor.environment === 'test' ? 'test_hosts' : 'hosts';
        
        const hostsRef = collection(db, hostsCollectionName);
        const q = query(hostsRef, where("name", "==", visitor.hostName));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Anfitrión "${visitor.hostName}" no encontrado para enviar notificación.`);
            return { success: true, message: 'Anfitrión no encontrado.' };
        }

        const host = querySnapshot.docs[0].data() as Host;

        if (!host.sendEntryNotification || !host.email) {
            return { success: true, message: `El anfitrión ${host.name} no desea recibir notificaciones o no tiene un email configurado.` };
        }
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const emailHtml = `
          <div>
            <h1>Nueva Visita Registrada</h1>
            <p>Hola ${host.name},</p>
            <p>Se ha registrado una nueva visita para ti.</p>
            <br/>
            <p><strong>Detalles de la visita:</strong></p>
            <ul>
              <li><strong>Visitante:</strong> ${visitor.visitorName}</li>
              <li><strong>Empresa:</strong> ${visitor.companyName}</li>
              <li><strong>Motivo:</strong> ${visitor.purposeOfVisit}</li>
              ${visitor.entryType === 'Transportista' && visitor.vehicleDetails ? `
              <li><strong>Matrícula Camión:</strong> ${visitor.vehicleDetails.licensePlate || 'N/A'}</li>
              <li><strong>Matrícula Remolque:</strong> ${visitor.vehicleDetails.trailerLicensePlate || 'N/A'}</li>
              ` : ''}
            </ul>
            <br/>
            <p>Saludos cordiales,</p>
            <p><strong>Sistema de Registro de Visitas</strong></p>
          </div>
        `;

        await transporter.sendMail({
            from: `"Sistema de Registros" <${process.env.GMAIL_EMAIL}>`,
            to: host.email,
            subject: `Notificación de Visita: ${visitor.visitorName}`,
            html: emailHtml,
        });

        return { success: true, message: `Notificación enviada a ${host.name}.` };
    } catch (error: any) {
        console.error('Error sending entry notification email:', error);

        if (error instanceof FirebaseError && 
            (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email')) {
            return { success: false, message: 'Error de autenticación con la cuenta de servicio de Firebase. Verifique las variables de entorno FIREBASE_SERVICE_EMAIL y FIREBASE_SERVICE_PASSWORD. Si cambió la contraseña de este usuario recientemente, debe actualizarla aquí también.' };
        }
        
        return { success: false, message: error.message || 'No se pudo enviar la notificación por correo.' };
    }
}

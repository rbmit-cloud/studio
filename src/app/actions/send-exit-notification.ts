'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, type Firestore } from 'firebase/firestore';
import * as nodemailer from 'nodemailer';
import { firebaseConfig } from '@/firebase/config';
import type { Host } from '@/lib/types';
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

type ExitNotificationPayload = {
    visitorName: string;
    companyName?: string;
    hostName?: string;
    entryDateTime: string;
    exitDateTime: string;
    environment: 'prod' | 'test';
};

export async function sendExitNotificationEmail(payload: ExitNotificationPayload): Promise<{ success: boolean; message: string }> {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return { success: false, message: 'Las credenciales de Gmail no están configuradas en las variables de entorno.' };
    }

    if (!payload.hostName) {
        return { success: true, message: 'No se ha especificado un anfitrión. No se enviará notificación.' };
    }

    try {
        const db = await getAuthenticatedFirestore();
        const hostsCollectionName = payload.environment === 'test' ? 'test_hosts' : 'hosts';
        
        const hostsRef = collection(db, hostsCollectionName);
        const q = query(hostsRef, where("name", "==", payload.hostName));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Anfitrión "${payload.hostName}" no encontrado para enviar notificación de salida.`);
            return { success: true, message: 'Anfitrión no encontrado.' };
        }

        const host = querySnapshot.docs[0].data() as Host;

        if (!host.sendExitNotification || !host.email) {
            return { success: true, message: `El anfitrión ${host.name} no desea recibir notificaciones de salida o no tiene un email configurado.` };
        }
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
        
        const entryTime = new Date(payload.entryDateTime).toLocaleString('es-ES');
        const exitTime = new Date(payload.exitDateTime).toLocaleString('es-ES');

        const emailHtml = `
          <div>
            <h1>Registro de Salida de Visita</h1>
            <p>Hola ${host.name},</p>
            <p>Se ha registrado la salida de un visitante que te estaba visitando.</p>
            <br/>
            <p><strong>Detalles de la visita:</strong></p>
            <ul>
              <li><strong>Visitante:</strong> ${payload.visitorName}</li>
              <li><strong>Empresa:</strong> ${payload.companyName || 'N/A'}</li>
              <li><strong>Hora de Entrada:</strong> ${entryTime}</li>
              <li><strong>Hora de Salida:</strong> ${exitTime}</li>
            </ul>
            <br/>
            <p>Saludos cordiales,</p>
            <p><strong>Sistema de Registro de Visitas</strong></p>
          </div>
        `;

        await transporter.sendMail({
            from: `"Sistema de Registros" <${process.env.GMAIL_EMAIL}>`,
            to: host.email,
            subject: `Registro de Salida: ${payload.visitorName}`,
            html: emailHtml,
        });

        return { success: true, message: `Notificación de salida enviada a ${host.name}.` };
    } catch (error: any) {
        console.error('Error sending exit notification email:', error);

        if (error instanceof FirebaseError && 
            (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email')) {
            return { success: false, message: 'Error de autenticación con la cuenta de servicio de Firebase. Verifique las variables de entorno FIREBASE_SERVICE_EMAIL y FIREBASE_SERVICE_PASSWORD.' };
        }
        
        return { success: false, message: error.message || 'No se pudo enviar la notificación de salida por correo.' };
    }
}

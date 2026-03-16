'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, type Firestore } from 'firebase/firestore';
import * as nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import { firebaseConfig } from '@/firebase/config';
import type { Host, Visitor } from '@/lib/types';
import { FirebaseError } from 'firebase/app';

// Define a constant for our service app's name
const SERVICE_APP_NAME = 'firebase-service-account-app';

/**
 * Initializes a dedicated Firebase app for the service account,
 * signs it in, and returns an authenticated Firestore instance.
 * This function is idempotent, meaning it won't create multiple app instances.
 */
async function getAuthenticatedFirestore(): Promise<Firestore> {
    // Check if the service app is already initialized
    const serviceApp = getApps().find(app => app.name === SERVICE_APP_NAME) 
                     || initializeApp(firebaseConfig, SERVICE_APP_NAME);

    const auth = getAuth(serviceApp);

    // Sign in only if we aren't already signed in as the service user
    if (auth.currentUser?.email !== process.env.FIREBASE_SERVICE_EMAIL) {
        // Non-null assertions are safe here because the calling function checks for their existence.
        await signInWithEmailAndPassword(auth, process.env.FIREBASE_SERVICE_EMAIL!, process.env.FIREBASE_SERVICE_PASSWORD!);
    }
    
    // Return the Firestore instance associated with our authenticated service app
    return getFirestore(serviceApp);
}

export async function sendEmailReport(visits: (Visitor & { id: string })[], reportTitle: string, hostsCollectionName: 'hosts' | 'test_hosts'): Promise<{ success: boolean; message: string }> {
    // --- Start: Environment Variable Validation ---
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
        return { success: false, message: 'Las credenciales de Gmail no están configuradas en las variables de entorno. Por favor, añada GMAIL_EMAIL y GMAIL_APP_PASSWORD.' };
    }
    if (!process.env.FIREBASE_SERVICE_EMAIL || !process.env.FIREBASE_SERVICE_PASSWORD) {
        return { success: false, message: 'Las credenciales de la cuenta de servicio de Firebase no están configuradas. Por favor, añada FIREBASE_SERVICE_EMAIL y FIREBASE_SERVICE_PASSWORD a sus variables de entorno.' };
    }
    // --- End: Environment Variable Validation ---

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    try {
        // Get an authenticated Firestore instance
        const db = await getAuthenticatedFirestore();
        
        // 1. Get hosts who want to receive reports
        const hostsRef = collection(db, hostsCollectionName);
        const q = query(hostsRef, where("sendRecords", "==", true));
        const querySnapshot = await getDocs(q);

        const hostsToSend = querySnapshot.docs
            .map(doc => doc.data() as Host)
            .filter(host => host.email && host.email.trim() !== '');


        if (hostsToSend.length === 0) {
            return { success: true, message: 'No hay anfitriones configurados para recibir correos.' };
        }

        // 2. Generate XLSX buffer
        const dataToExport = visits.map(visit => {
          const entryDateTime = new Date(visit.entryDateTime);
          const exitDateTime = visit.exitDateTime ? new Date(visit.exitDateTime) : null;
          return {
              "Tipo Entrada": visit.entryType,
              "Nombre Visitante": visit.visitorName,
              "Empresa": visit.companyName,
              "Motivo Visita": visit.purposeOfVisit,
              "Anfitrión": visit.hostName || '',
              "Departamento Anfitrión": visit.department || '',
              "Matrícula Camión": visit.entryType === 'Transportista' ? visit.vehicleDetails?.licensePlate || '' : '',
              "Matrícula Remolque": visit.entryType === 'Transportista' ? visit.vehicleDetails?.trailerLicensePlate || '' : '',
              "Fecha Entrada": entryDateTime.toLocaleDateString('es-ES'),
              "Hora Entrada": entryDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              "Fecha Salida": exitDateTime ? exitDateTime.toLocaleDateString('es-ES') : 'Dentro',
              "Hora Salida": exitDateTime ? exitDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''
          };
        });
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");
        const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 3. Send email to each host
        const emailsToSend = hostsToSend.map(host => {
            if (!host.email) return null;

            const emailHtml = `
              <div>
                <h1>${reportTitle}</h1>
                <p>Hola ${host.name},</p>
                <p>Adjunto encontrarás el informe de visitas solicitado.</p>
                <p>Saludos cordiales,</p>
                <p>Sistema de Registro de Visitas</p>
              </div>
            `;

            return transporter.sendMail({
                from: `"Sistema de Registros" <${process.env.GMAIL_EMAIL}>`,
                to: host.email,
                subject: reportTitle,
                html: emailHtml,
                attachments: [
                    {
                        filename: 'reporte_visitas.xlsx',
                        content: xlsxBuffer,
                        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    },
                ],
            });
        }).filter(Boolean);

        await Promise.all(emailsToSend);

        return { success: true, message: `Informe enviado a ${hostsToSend.length} anfitriones.` };
    } catch (error: any) {
        console.error('Error sending email report:', error);

        if (error.code === 'firestore/failed-precondition') {
            return { success: false, message: 'La consulta requiere un índice de Firestore. Por favor, revise los registros para crear el índice necesario.' };
        }
        
        if (error instanceof FirebaseError && 
            (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email')) {
            return { success: false, message: 'Error de autenticación con la cuenta de servicio de Firebase. Verifique las variables de entorno FIREBASE_SERVICE_EMAIL y FIREBASE_SERVICE_PASSWORD. Si cambió la contraseña de este usuario recientemente, debe actualizarla aquí también.' };
        }
        
        return { success: false, message: error.message || 'No se pudo enviar el informe por correo.' };
    }
}

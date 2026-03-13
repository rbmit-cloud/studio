'use server';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { Resend } from 'resend';
import * as XLSX from 'xlsx';
import { firebaseConfig } from '@/firebase/config';
import type { Host, Visitor } from '@/lib/types';
import EmailTemplate from '@/components/email-template';

// Ensure Firebase is initialized
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureAuthenticated() {
    // Check if we're already signed in as the service user
    if (auth.currentUser?.email === process.env.FIREBASE_SERVICE_EMAIL) {
        return;
    }
    // Sign out any other user (like anonymous)
    if (auth.currentUser) {
        await auth.signOut();
    }
    // Sign in with service account credentials from environment variables
    if (process.env.FIREBASE_SERVICE_EMAIL && process.env.FIREBASE_SERVICE_PASSWORD) {
        await signInWithEmailAndPassword(auth, process.env.FIREBASE_SERVICE_EMAIL, process.env.FIREBASE_SERVICE_PASSWORD);
    } else {
        throw new Error('Firebase service account credentials are not configured in environment variables.');
    }
}

export async function sendEmailReport(visits: (Visitor & { id: string })[], reportTitle: string): Promise<{ success: boolean; message: string }> {
    if (!process.env.RESEND_API_KEY) {
        return { success: false, message: 'Resend API key is not configured.' };
    }
     if (!process.env.RESEND_FROM_EMAIL) {
        return { success: false, message: 'Resend "from" email is not configured.' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await ensureAuthenticated();
        
        // 1. Get hosts who want to receive reports
        const hostsRef = collection(db, "hosts");
        const q = query(hostsRef, where("sendRecords", "==", true), where("email", "!=", ""));
        const querySnapshot = await getDocs(q);

        const hostsToSend = querySnapshot.docs.map(doc => doc.data() as Host);

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
            return resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL!,
                to: host.email,
                subject: reportTitle,
                react: EmailTemplate({ hostName: host.name, reportTitle }),
                attachments: [
                    {
                        filename: 'reporte_visitas.xlsx',
                        content: xlsxBuffer,
                    },
                ],
            });
        }).filter(Boolean);

        await Promise.all(emailsToSend);

        return { success: true, message: `Informe enviado a ${hostsToSend.length} anfitriones.` };
    } catch (error: any) {
        console.error('Error sending email report:', error);
        return { success: false, message: error.message || 'No se pudo enviar el informe por correo.' };
    }
}

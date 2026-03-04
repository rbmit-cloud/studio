'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, User } from 'lucide-react';
import type { Visitor } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, type DocumentReference } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

function VisitorRow({ visitor }: { visitor: Visitor & { id: string } }) {
  const isTransportista = visitor.entryType === 'Transportista';
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-full">
              {isTransportista ? <Truck className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <div className="font-medium">{visitor.visitorName}</div>
              <div className="text-sm text-muted-foreground">{visitor.companyName}</div>
            </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={isTransportista ? 'secondary' : 'outline'}>
          {visitor.entryType}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">{visitor.purposeOfVisit}</TableCell>
      <TableCell className="hidden md:table-cell">
        {isTransportista ? visitor.vehicleDetails?.licensePlate : visitor.hostName}
      </TableCell>
      <TableCell className="text-right">
        <div>{new Date(visitor.entryDateTime).toLocaleDateString('es-ES')}</div>
        <div className="text-sm text-muted-foreground">
          {new Date(visitor.entryDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {visitor.exitDateTime ? (
          <div>
            <div>{new Date(visitor.exitDateTime).toLocaleDateString('es-ES')}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(visitor.exitDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          <Badge variant="destructive">Dentro</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function RegistrosPage() {
  const [visits, setVisits] = useState<(Visitor & { id: string })[]>([]);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'visits'), orderBy('entryDateTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const visitsData: (Visitor & { id: string })[] = [];
      const updatesToPerform: { ref: DocumentReference, data: { exitDateTime: string } }[] = [];

      querySnapshot.forEach((doc) => {
        const visit = { id: doc.id, ...doc.data() } as Visitor & { id: string };

        // Lógica de cierre automático
        if (!visit.exitDateTime) {
          const entryDateTime = new Date(visit.entryDateTime);
          const checkoutTime = new Date(entryDateTime);
          
          // Establecer a las 8:00 AM del día siguiente
          checkoutTime.setDate(checkoutTime.getDate() + 1);
          checkoutTime.setHours(8, 0, 0, 0);

          const now = new Date();

          if (now > checkoutTime) {
            // Si la hora actual es posterior a la hora de cierre automático, actualiza la visita
            const newExitTime = checkoutTime.toISOString();
            updatesToPerform.push({ ref: doc.ref, data: { exitDateTime: newExitTime } });
            
            // Actualiza también el objeto que vamos a meter en el estado para una actualización inmediata de la UI
            visit.exitDateTime = newExitTime;
          }
        }
        
        visitsData.push(visit);
      });

      // Realiza todas las actualizaciones en paralelo
      if (updatesToPerform.length > 0) {
        const updatePromises = updatesToPerform.map(update => updateDoc(update.ref, update.data));
        Promise.all(updatePromises).catch(error => {
          console.error("Error al actualizar visitas automáticamente: ", error);
        });
      }

      setVisits(visitsData);
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Visitas</CardTitle>
        <CardDescription>
          Aquí se muestra un historial completo de todas las visitas registradas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitante</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden lg:table-cell">Propósito</TableHead>
              <TableHead className="hidden md:table-cell">Detalles</TableHead>
              <TableHead className="text-right">Entrada</TableHead>
              <TableHead className="text-right">Salida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.length > 0 ? (
                visits.map((visitor) => (
                    <VisitorRow key={visitor.id} visitor={visitor} />
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No hay registros de visitas todavía.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

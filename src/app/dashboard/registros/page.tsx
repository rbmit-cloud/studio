'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, User, X, FileDown, ChevronDown } from 'lucide-react';
import type { Visitor } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, type DocumentReference } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

type DateRange = {
  from?: Date;
  to?: Date;
}

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
      <TableCell className="hidden md:table-cell">{visitor.purposeOfVisit}</TableCell>
      <TableCell className="hidden lg:table-cell">{visitor.hostName}</TableCell>
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
  const [date, setDate] = useState<DateRange | undefined>();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // Por defecto, mostrar las visitas del día actual al cargar la página en el cliente.
    const today = new Date();
    setDate({
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999)),
    });
  }, []);

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

  const activeVisits = useMemo(() => {
    return visits.filter(visit => !visit.exitDateTime);
  }, [visits]);

  const filteredVisits = useMemo(() => {
    if (!date?.from) {
      return visits;
    }
    return visits.filter(visit => {
      const visitDate = new Date(visit.entryDateTime);
      const fromDate = new Date(date.from!);
      fromDate.setHours(0, 0, 0, 0);
  
      if (visitDate < fromDate) return false;
  
      const toDate = date.to ? new Date(date.to) : new Date(date.from!);
      toDate.setHours(23, 59, 59, 999);
  
      if (visitDate > toDate) return false;
  
      return true;
    });
  }, [visits, date]);

  const handleExportXlsx = () => {
    if (!filteredVisits || filteredVisits.length === 0) {
        toast({
            title: 'No hay datos para exportar',
            description: 'Filtre un rango de fechas con visitas para poder exportar.',
            variant: 'destructive',
        });
        return;
    }

    const dataToExport = filteredVisits.map(visit => {
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
    XLSX.writeFile(workbook, "registro_visitas.xlsx");
  };

  const handleSendEmail = () => {
    const subject = "Exportación de Registros de Visitas";
    const body = "Por favor, primero descargue el archivo XLSX usando la opción 'Descargar XLSX' y luego adjúntelo a este correo.";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handleExportActiveVisitsXlsx = () => {
    if (!activeVisits || activeVisits.length === 0) {
        toast({
            title: 'No hay visitas activas para exportar',
            variant: 'destructive',
        });
        return;
    }

    const dataToExport = activeVisits.map(visit => {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitas Activas");
    XLSX.writeFile(workbook, "visitas_activas.xlsx");
  };

  const handleSendActiveVisitsEmail = () => {
    const subject = "Exportación de Visitas Activas";
    const body = "Por favor, primero descargue el archivo XLSX usando la opción 'Descargar XLSX' y luego adjúntelo a este correo.";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'from' | 'to') => {
    const { value } = e.target;
    const newDate = value ? new Date(value + 'T00:00:00') : undefined;

    setDate(currentRange => {
        const updatedRange = { ...currentRange };
        if (field === 'from') {
            updatedRange.from = newDate;
            if (newDate && updatedRange.to && newDate > updatedRange.to) {
                updatedRange.to = undefined;
            }
        } else {
            updatedRange.to = newDate;
        }
        if(!updatedRange.from && !updatedRange.to) return undefined;
        return updatedRange;
    });
  };

  const formatDateForInput = (date: Date | undefined): string => {
      if (!date) return '';
      return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Visitas Activas</CardTitle>
                  <CardDescription>
                  Visitantes que se encuentran actualmente en las instalaciones.
                  </CardDescription>
              </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                          <FileDown className="mr-2 h-4 w-4" />
                          Exportar
                          <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={handleExportActiveVisitsXlsx}>
                          Descargar XLSX
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSendActiveVisitsEmail}>
                          Enviar por Email
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitante</TableHead>
                <TableHead className="hidden md:table-cell">Propósito</TableHead>
                <TableHead className="hidden lg:table-cell">Anfitrión</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Salida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeVisits.length > 0 ? (
                  activeVisits.map((visitor) => (
                      <VisitorRow key={visitor.id} visitor={visitor} />
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          No hay visitas activas en este momento.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                  <CardTitle>Registro de Visitas</CardTitle>
              </div>
              <div className="flex flex-wrap items-end gap-2 md:flex-nowrap">
                  <div className="grid gap-1">
                      <label htmlFor="date-from" className="text-sm font-medium text-muted-foreground">Desde</label>
                      <input
                          id="date-from"
                          type="date"
                          value={formatDateForInput(date?.from)}
                          onChange={(e) => handleDateChange(e, 'from')}
                          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                  </div>
                  <div className="grid gap-1">
                      <label htmlFor="date-to" className="text-sm font-medium text-muted-foreground">Hasta</label>
                      <input
                          id="date-to"
                          type="date"
                          value={formatDateForInput(date?.to)}
                          onChange={(e) => handleDateChange(e, 'to')}
                          min={formatDateForInput(date?.from)}
                          disabled={!date?.from}
                          className="h-10 rounded-md border border-input bg-transparent px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                  </div>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" className='h-10'>
                              <FileDown className="mr-2 h-4 w-4" />
                              Exportar
                              <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleExportXlsx}>
                              Descargar XLSX
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSendEmail}>
                              Enviar por Email
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  {date && (
                      <Button variant="outline" className="h-10" onClick={() => { setDate(undefined); }}>
                          <X className="h-4 w-4 mr-2" />
                          Limpiar
                      </Button>
                  )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Visitante</TableHead>
                    <TableHead className="hidden md:table-cell">Propósito</TableHead>
                    <TableHead className="hidden lg:table-cell">Anfitrión</TableHead>
                    <TableHead className="text-right">Entrada</TableHead>
                    <TableHead className="text-right">Salida</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisits.length > 0 ? (
                  filteredVisits.map((visitor) => (
                      <VisitorRow key={visitor.id} visitor={visitor} />
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                          {date ? 'No hay registros que coincidan con su búsqueda.' : 'Seleccione un rango de fechas para ver los registros.'}
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

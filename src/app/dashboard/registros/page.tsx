'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, User, Calendar as CalendarIcon, X, FileDown, ChevronDown } from 'lucide-react';
import type { Visitor } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, type DocumentReference } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [openDateFrom, setOpenDateFrom] = useState(false);
  const [openDateTo, setOpenDateTo] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    // Por defecto, mostrar las visitas del día actual al cargar la página en el cliente.
    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
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
    return visits.filter(visit => {
      const visitDate = new Date(visit.entryDateTime);
      
      if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0,0,0,0); // Start of day
          if (visitDate < fromDate) {
              return false;
          }
      }
      if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (visitDate > toDate) {
              return false;
          }
      }
      return true;
    });
  }, [visits, dateFrom, dateTo]);

  const handleExportCsv = () => {
    if (!filteredVisits || filteredVisits.length === 0) {
        toast({
            title: 'No hay datos para exportar',
            description: 'Filtre un rango de fechas con visitas para poder exportar.',
            variant: 'destructive',
        });
        return;
    }

    const headers = [
        "Tipo Entrada",
        "Nombre Visitante",
        "Empresa",
        "Cliente Final (Transporte)",
        "Motivo Visita",
        "Anfitrión",
        "Departamento Anfitrión",
        "Matrícula Camión",
        "Matrícula Remolque",
        "Fecha Entrada",
        "Hora Entrada",
        "Fecha Salida",
        "Hora Salida"
    ];

    const csvRows = filteredVisits.map(visit => {
        const entryDateTime = new Date(visit.entryDateTime);
        const exitDateTime = visit.exitDateTime ? new Date(visit.exitDateTime) : null;
        
        const row = [
            visit.entryType,
            visit.visitorName,
            visit.companyName,
            visit.entryType === 'Transportista' ? visit.clientCompany || '' : '',
            visit.purposeOfVisit,
            visit.hostName || '',
            visit.department || '',
            visit.entryType === 'Transportista' ? visit.vehicleDetails?.licensePlate || '' : '',
            visit.entryType === 'Transportista' ? visit.vehicleDetails?.trailerLicensePlate || '' : '',
            entryDateTime.toLocaleDateString('es-ES'),
            entryDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            exitDateTime ? exitDateTime.toLocaleDateString('es-ES') : 'Dentro',
            exitDateTime ? exitDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''
        ];
        
        return row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'registro_visitas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmail = () => {
    const subject = "Exportación de Registros de Visitas";
    const body = "Por favor, primero descargue el archivo CSV usando la opción 'Descargar CSV' y luego adjúntelo a este correo.";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handleExportActiveVisitsCsv = () => {
    if (!activeVisits || activeVisits.length === 0) {
        toast({
            title: 'No hay visitas activas para exportar',
            variant: 'destructive',
        });
        return;
    }

    const headers = [
        "Tipo Entrada",
        "Nombre Visitante",
        "Empresa",
        "Cliente Final (Transporte)",
        "Motivo Visita",
        "Anfitrión",
        "Departamento Anfitrión",
        "Matrícula Camión",
        "Matrícula Remolque",
        "Fecha Entrada",
        "Hora Entrada",
        "Fecha Salida",
        "Hora Salida"
    ];

    const csvRows = activeVisits.map(visit => {
        const entryDateTime = new Date(visit.entryDateTime);
        const exitDateTime = visit.exitDateTime ? new Date(visit.exitDateTime) : null;
        
        const row = [
            visit.entryType,
            visit.visitorName,
            visit.companyName,
            visit.entryType === 'Transportista' ? visit.clientCompany || '' : '',
            visit.purposeOfVisit,
            visit.hostName || '',
            visit.department || '',
            visit.entryType === 'Transportista' ? visit.vehicleDetails?.licensePlate || '' : '',
            visit.entryType === 'Transportista' ? visit.vehicleDetails?.trailerLicensePlate || '' : '',
            entryDateTime.toLocaleDateString('es-ES'),
            entryDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            exitDateTime ? exitDateTime.toLocaleDateString('es-ES') : 'Dentro',
            exitDateTime ? exitDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''
        ];
        
        return row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'visitas_activas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendActiveVisitsEmail = () => {
    const subject = "Exportación de Visitas Activas";
    const body = "Por favor, primero descargue el archivo CSV usando la opción 'Descargar CSV' y luego adjúntelo a este correo.";
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
                      <DropdownMenuItem onClick={handleExportActiveVisitsCsv}>
                          Descargar CSV
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
              <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                  <Popover open={openDateFrom} onOpenChange={setOpenDateFrom}>
                      <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full sm:w-[240px] justify-start text-left font-normal",
                                  !dateFrom && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateFrom ? format(dateFrom, "P", { locale: es }) : <span>Desde fecha</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={dateFrom}
                              onSelect={(date) => {
                                setDateFrom(date);
                                setOpenDateFrom(false);
                              }}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
                  <Popover open={openDateTo} onOpenChange={setOpenDateTo}>
                      <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full sm:w-[240px] justify-start text-left font-normal",
                                  !dateTo && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateTo ? format(dateTo, "P", { locale: es }) : <span>Hasta fecha</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={dateTo}
                              onSelect={(date) => {
                                setDateTo(date);
                                setOpenDateTo(false);
                              }}
                              disabled={{ before: dateFrom }}
                              initialFocus
                          />
                      </PopoverContent>
                  </Popover>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                              <FileDown className="mr-2 h-4 w-4" />
                              Exportar
                              <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={handleExportCsv}>
                              Descargar CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleSendEmail}>
                              Enviar por Email
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                  {(dateFrom || dateTo) && (
                      <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                          <X className="h-4 w-4 mr-1" />
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
                          {dateFrom || dateTo ? 'No hay registros que coincidan con su búsqueda.' : 'No hay registros de visitas todavía.'}
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

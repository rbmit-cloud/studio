import { generateMockVisitorData } from '@/ai/flows/generate-mock-visitor-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Truck, User } from 'lucide-react';
import type { Visitor } from '@/lib/types';

function VisitorRow({ visitor }: { visitor: Visitor }) {
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
    </TableRow>
  );
}


export default async function RegistrosPage() {
  const visitors = await generateMockVisitorData({ count: 15 });

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
              <TableHead className="text-right">Fecha y Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitors.map((visitor) => (
              <VisitorRow key={visitor.id} visitor={visitor} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

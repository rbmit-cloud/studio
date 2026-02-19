import { generateMockVisitorData } from '@/ai/flows/generate-mock-visitor-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Truck, Users, ArrowUpRight } from 'lucide-react';
import type { Visitor } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function VisitorRow({ visitor }: { visitor: Visitor }) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{visitor.visitorName}</div>
        <div className="text-sm text-muted-foreground">{visitor.companyName}</div>
      </TableCell>
      <TableCell>
        <Badge variant={visitor.entryType === 'Transportista' ? 'secondary' : 'outline'}>
          {visitor.entryType}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{visitor.purposeOfVisit}</TableCell>
      <TableCell className="text-right">
        {new Date(visitor.entryDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </TableCell>
    </TableRow>
  );
}

export default async function DashboardPage() {
  const recentVisitors = await generateMockVisitorData({ count: 5 });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+20.1% desde ayer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportistas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+12% desde ayer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">83</div>
            <p className="text-xs text-muted-foreground">+25.3% desde ayer</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pico de Actividad</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">11:30 AM</div>
            <p className="text-xs text-muted-foreground">Hora de mayor afluencia</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Visitas Recientes</CardTitle>
                <CardDescription>
                    Las últimas 5 visitas registradas en el sistema.
                </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/registros">
                    Ver Todos
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitante</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Propósito</TableHead>
                <TableHead className="text-right">Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentVisitors.map((visitor) => (
                <VisitorRow key={visitor.id} visitor={visitor} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

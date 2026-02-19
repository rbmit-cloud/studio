'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Activity, Truck, Users, ArrowUpRight, Clock } from 'lucide-react';
import type { Visitor } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

function VisitorRow({ visitor }: { visitor: Visitor & {id: string} }) {
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

export default function DashboardPage() {
    const [recentVisitors, setRecentVisitors] = useState<(Visitor & {id: string})[]>([]);
    const [stats, setStats] = useState({
        totalToday: 0,
        transportistasToday: 0,
        personalToday: 0,
        peakTime: 'N/A'
    });
    const db = useFirestore();

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    useEffect(() => {
        if (!db) return;

        const qRecent = query(collection(db, 'visits'), orderBy('entryDateTime', 'desc'), limit(5));
        const unsubscribeRecent = onSnapshot(qRecent, (snapshot) => {
            const visitorsData: (Visitor & {id: string})[] = [];
            snapshot.forEach((doc) => {
                visitorsData.push({ id: doc.id, ...doc.data() } as Visitor & {id: string});
            });
            setRecentVisitors(visitorsData);
        });

        const qToday = query(collection(db, 'visits'), where('entryDateTime', '>=', startOfDay), where('entryDateTime', '<=', endOfDay));
        const unsubscribeToday = onSnapshot(qToday, (snapshot) => {
            const visitsToday = snapshot.docs.map(doc => doc.data() as Visitor);

            const totalToday = visitsToday.length;
            const transportistasToday = visitsToday.filter(v => v.entryType === 'Transportista').length;
            const personalToday = totalToday - transportistasToday;

            let peakTime = 'N/A';
            if (totalToday > 0) {
                const hours = visitsToday.map(v => new Date(v.entryDateTime).getHours());
                const hourCounts = hours.reduce((acc, hour) => {
                    acc[hour] = (acc[hour] || 0) + 1;
                    return acc;
                }, {} as Record<number, number>);
                
                const peakHour = Object.keys(hourCounts).length > 0 ?
                    parseInt(Object.keys(hourCounts).reduce((a, b) => hourCounts[parseInt(a)] > hourCounts[parseInt(b)] ? a : b))
                    : -1;
                
                if (peakHour !== -1) {
                    peakTime = `${String(peakHour).padStart(2, '0')}:00 - ${String(peakHour + 1).padStart(2, '0')}:00`;
                }
            }

            setStats({ totalToday, transportistasToday, personalToday, peakTime });
        });

        return () => {
            unsubscribeRecent();
            unsubscribeToday();
        };

    }, [db, startOfDay, endOfDay]);


  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportistas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transportistasToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.personalToday}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pico de Actividad</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.peakTime}</div>
            <p className="text-xs text-muted-foreground">Hora de mayor afluencia hoy</p>
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
              {recentVisitors.length > 0 ? (
                recentVisitors.map((visitor) => (
                    <VisitorRow key={visitor.id} visitor={visitor} />
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No hay visitas recientes.
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

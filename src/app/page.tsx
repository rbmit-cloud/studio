import Link from 'next/link';
import { Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateTime } from '@/components/date-time';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary">VisitaLog Pro</h1>
          <p className="mt-2 text-lg md:text-xl text-muted-foreground">Sistema de Registro de Visitas</p>
        </div>
        
        <DateTime />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/personal/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg">
                <User className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Entrada Personal</h2>
                <p className="mt-2 text-muted-foreground">Registrar la entrada de visitantes, personal y entrevistas.</p>
              </Link>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/transportista/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg">
                <Truck className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Entrada Transportista</h2>
                <p className="mt-2 text-muted-foreground">Registrar la entrada de camiones y vehículos de reparto.</p>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <Button asChild variant="outline">
          <Link href="/dashboard/registros">Ver Registro de Visitas</Link>
        </Button>
      </div>
    </main>
  );
}

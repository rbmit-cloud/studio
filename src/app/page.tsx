import Link from 'next/link';
import Image from 'next/image';
import { Truck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateTime } from '@/components/date-time';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-8">
        
        <Image src="/robama-logo.jpg" alt="Logo de Robama" width={520} height={130} />
        <DateTime />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/personal/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg">
                <User className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Entrada Personal</h2>
              </Link>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/transportista/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg">
                <Truck className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Entrada Transportista</h2>
              </Link>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/salida" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg">
                <LogOut className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Registrar Salida</h2>
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

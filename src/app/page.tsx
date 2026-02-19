'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Truck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DateTime } from '@/components/date-time';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Simple hardcoded check
    if (username === 'admin' && password === 'Robama2024') {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al panel de administración...",
      });
      router.push('/dashboard');
    } else {
      toast({
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos.",
        variant: "destructive",
      });
    }
    // Reset fields and close dialog
    setUsername('');
    setPassword('');
    setOpen(false); 
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-4">
        
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={800} height={222} className="w-[800px] h-auto" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Administración</DialogTitle>
                    <DialogDescription>
                    Ingrese sus credenciales para acceder al panel de administración.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Usuario
                        </Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="col-span-3"
                            autoComplete="username"
                        />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password"className="text-right">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="col-span-3"
                            autoComplete="current-password"
                        />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Iniciar Sesión</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <DateTime />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 md:gap-8 w-full max-w-6xl mt-2">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-red-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/personal/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg active:bg-destructive active:text-destructive-foreground">
                <User className="w-20 h-20 mb-4" />
                <h2 className="text-2xl font-semibold">Entrada Personal</h2>
              </Link>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-cyan-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/transportista/nuevo" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg active:bg-info active:text-info-foreground">
                <Truck className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Entrada Transportista</h2>
              </Link>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-yellow-2xl">
            <CardContent className="p-0">
              <Link href="/dashboard/salida" className="flex flex-col items-center justify-center h-64 p-6 text-center rounded-lg active:bg-warning active:text-warning-foreground">
                <LogOut className="w-20 h-20 mb-4 text-primary" />
                <h2 className="text-2xl font-semibold text-card-foreground">Registrar Salida</h2>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        <Button asChild variant="outline" className="mt-2">
          <Link href="/dashboard/registros">Ver Registro de Visitas</Link>
        </Button>
      </div>
    </main>
  );
}

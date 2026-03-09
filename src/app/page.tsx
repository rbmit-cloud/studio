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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';


export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginDestination, setLoginDestination] = useState<string>('');

  const handleLogin = async () => {
    if (!db) {
        toast({
            title: "Error",
            description: "La base de datos no está disponible.",
            variant: "destructive"
        });
        return;
    }

    try {
        const q = query(
            collection(db, "hosts"),
            where("email", "==", email),
            where("isAdmin", "==", true),
            where("password", "==", password)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({
                title: "Error de autenticación",
                description: "Correo electrónico o contraseña incorrectos, o no es un administrador.",
                variant: "destructive",
            });
        } else {
            toast({
                title: "Inicio de sesión exitoso",
                description: "Redirigiendo...",
            });
            router.push(loginDestination);
        }

    } catch (error) {
        console.error("Error during login: ", error);
        toast({
            title: "Error de inicio de sesión",
            description: "Ocurrió un error al intentar iniciar sesión.",
            variant: "destructive",
        });
    }

    setEmail('');
    setPassword('');
    setOpen(false); 
    setLoginDestination('');
  };
  
  const handleOpenDialog = (destination: string) => {
    setLoginDestination(destination);
    setOpen(true);
  }

  const handleCloseDialog = (isOpen: boolean) => {
    if (!isOpen) {
        setEmail('');
        setPassword('');
        setLoginDestination('');
    }
    setOpen(isOpen);
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center gap-2">
        
        <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={400} height={111} className="w-[400px] h-auto" />
        
        <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Acceso Restringido</DialogTitle>
                    <DialogDescription>
                    Ingrese sus credenciales para acceder a esta sección.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Correo Electrónico
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="col-span-3"
                            autoComplete="off"
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
                            autoComplete="off"
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
        
        <div className="flex items-center justify-center gap-4 mt-2">
            <Button variant="outline" onClick={() => handleOpenDialog('/dashboard/registros')}>
              Ver Registro de Visitas
            </Button>
            <Button variant="outline" onClick={() => handleOpenDialog('/admin')}>
                Administración
            </Button>
        </div>
      </div>
    </main>
  );
}

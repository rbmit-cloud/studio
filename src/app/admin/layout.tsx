'use client';

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEnvironment } from "@/context/environment-context";
import { useState } from "react";
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
import { useAuth } from '@/firebase';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { environment, toggleEnvironment } = useEnvironment();
  const { toast } = useToast();
  const auth = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleToggleClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmToggle = async () => {
    const user = auth?.currentUser;

    if (!user || !user.email) {
        toast({
            title: "Error de autenticación",
            description: "No se pudo encontrar un usuario válido para reautenticar.",
            variant: "destructive"
        });
        return;
    }
    
    if (!password) {
        toast({
            title: "Contraseña requerida",
            description: "Por favor, ingrese su contraseña.",
            variant: "destructive"
        });
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        toast({
            title: "Autenticación correcta",
            description: `Cambiando a entorno de ${environment === 'prod' ? 'pruebas' : 'producción'}.`,
        });
        
        setIsDialogOpen(false);
        setPassword('');
        toggleEnvironment(); // This reloads the page
        
    } catch (error: any) {
        console.error("Error during reauthentication: ", error);
        let description = "Ocurrió un error al verificar sus credenciales.";
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    description = "Contraseña incorrecta.";
                    break;
                case 'auth/user-mismatch':
                    description = "Las credenciales no corresponden al usuario actual.";
                    break;
                case 'auth/too-many-requests':
                    description = "Demasiados intentos fallidos. Inténtelo de nuevo más tarde.";
                    break;
                default:
                    description = "Error de autenticación. Por favor, inténtelo de nuevo.";
            }
        }
        toast({
            title: "Error de autenticación",
            description,
            variant: "destructive",
        });
        setPassword(''); // Clear password on error so user has to re-type
    }
  };

  const handleCloseDialog = (isOpen: boolean) => {
    if (!isOpen) {
        setPassword('');
    }
    setIsDialogOpen(isOpen);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConfirmToggle();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
            <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={140} height={35} />
        </div>
        <h1 className="flex-1 text-center text-xl font-semibold">Mantenimiento de Anfitriones</h1>
        <div className="flex items-center gap-2">
            <Button type="button" variant={environment === 'test' ? 'destructive' : 'default'} onClick={handleToggleClick} size="sm">
                {environment === 'test' ? 'DESACTIVAR ENTORNO TEST' : 'ACTIVAR ENTORNO TEST'}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                Salir
                <LogOut className="ml-2 h-4 w-4" />
              </Link>
            </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Confirmar Acción</DialogTitle>
                <DialogDescription>
                  Para cambiar de entorno, por favor, vuelva a introducir su contraseña para confirmar su identidad.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFormSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin-password"className="text-right">
                            Contraseña
                        </Label>
                        <Input
                            id="admin-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="col-span-3"
                            autoComplete="current-password"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit">Confirmar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

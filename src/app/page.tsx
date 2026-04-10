'use client';

import Image from 'next/image';
import { Truck, User, LogOut, Globe } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from '@/context/language-context';
import { Separator } from '@/components/ui/separator';


export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginDestination, setLoginDestination] = useState<string>('');
  const { setLanguage, t } = useLanguage();

  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [entryDestination, setEntryDestination] = useState<string>('');

  const handleLogin = async () => {
    if (!auth) {
        toast({
            title: "Error",
            description: "El servicio de autenticación no está disponible.",
            variant: "destructive"
        });
        return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "El servicio de autenticación se está inicializando, espere un momento.",
        variant: "destructive"
      });
      return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);

        toast({
            title: "Inicio de sesión exitoso",
            description: "Redirigiendo...",
        });
        router.push(loginDestination);

    } catch (error: any) {
        console.error("Error during login: ", error);
        let description = "Ocurrió un error al intentar iniciar sesión.";
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    description = "Correo electrónico o contraseña incorrectos. Asegúrese de que el usuario ha sido creado en la sección 'Authentication' de la Consola de Firebase.";
                    break;
                case 'auth/invalid-email':
                    description = "El formato del correo electrónico no es válido.";
                    break;
                default:
                    description = "Error de autenticación. Por favor, inténtelo de nuevo.";
            }
        }
        toast({
            title: "Error de inicio de sesión",
            description,
            variant: "destructive",
        });
    } finally {
        setEmail('');
        setPassword('');
        setOpen(false); 
        setLoginDestination('');
    }
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

  const handleEntryClick = (destination: string) => {
    if(isUserLoading) return;
    setEntryDestination(destination);
    setIsSafetyModalOpen(true);
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg px-4">
        <div className="w-full relative p-2 rounded-lg flex flex-col items-center justify-center bg-background">
            <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={300} height={79} className="h-auto" />
            <Separator className="my-4" />
            <DateTime />
            <div className="absolute right-0 top-0">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Seleccionar idioma</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLanguage('en')}>EN</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('es')}>ES</DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        
        <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('restrictedAccess')}</DialogTitle>
                    <DialogDescription>
                    {t('enterCredentials')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            {t('email')}
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
                            {t('password')}
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
                        <Button type="submit">{t('login')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isSafetyModalOpen} onOpenChange={setIsSafetyModalOpen}>
            <AlertDialogContent className="max-w-3xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('safetyRegulationsTitle')}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="text-sm text-foreground max-h-[70vh] overflow-y-auto pr-4 text-left whitespace-pre-line">
                    {t('safetyRegulationsContent')}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push(entryDestination)}>
                        {t('accept')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-col items-center gap-6 w-full mt-8">
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-red-2xl cursor-pointer" onClick={() => handleEntryClick('/dashboard/personal/nuevo')}>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg active:bg-destructive active:text-destructive-foreground main-page-button">
                <User className="w-20 h-20 md:w-24 md:h-24" />
                <h2 className="text-[20px] md:text-[26px] font-semibold text-center">{t('personalEntry')}</h2>
              </div>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-cyan-2xl cursor-pointer" onClick={() => handleEntryClick('/dashboard/transportista/nuevo')}>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg active:bg-info active:text-info-foreground main-page-button">
                <Truck className="w-20 h-20 md:w-24 md:h-24" />
                <h2 className="text-[20px] md:text-[26px] font-semibold text-card-foreground text-center">{t('transporterEntry')}</h2>
              </div>
            </CardContent>
          </Card>
          <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-yellow-2xl cursor-pointer" onClick={() => router.push('/dashboard/salida')}>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg active:bg-warning active:text-warning-foreground main-page-button">
                <LogOut className="w-20 h-20 md:w-24 md:h-24" />
                <h2 className="text-[20px] md:text-[26px] font-semibold text-card-foreground text-center">{t('registerExit')}</h2>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center gap-6 mt-12 w-full">
            <Button variant="outline" size="lg" onClick={() => handleOpenDialog('/dashboard/registros')}>
              {t('viewVisitLog')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleOpenDialog('/admin')}>
                {t('administration')}
            </Button>
        </div>
      </div>
    </main>
  );
}

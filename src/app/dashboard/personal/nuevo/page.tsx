'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { Host } from "@/lib/types";

const formSchema = z.object({
  visitorName: z.string().min(2, "El nombre y apellidos deben tener al menos 2 caracteres."),
  companyName: z.string().min(2, "La empresa debe tener al menos 2 caracteres."),
  purposeOfVisit: z.string(),
  hostName: z.string({
    required_error: "Debe seleccionar una persona a visitar.",
  }),
  department: z.string().optional(),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "Debe aceptar la política de tratamiento de datos.",
  }),
});

export default function PersonalFormPage() {
    const [isClient, setIsClient] = useState(false);
    const db = useFirestore();
    const router = useRouter();
    const [hosts, setHosts] = useState<Omit<Host, 'id' | 'email'>[]>([]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        let inactivityTimer: NodeJS.Timeout;

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                toast({
                    title: "Sesión inactiva",
                    description: "Regresando a la pantalla principal.",
                });
                router.push('/');
            }, 5 * 60 * 1000); // 5 minutes
        };

        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        
        const handleActivity = () => {
            resetInactivityTimer();
        };

        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        resetInactivityTimer(); // Start the timer on mount

        return () => {
            clearTimeout(inactivityTimer);
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isClient, router]);

    useEffect(() => {
        if (!db) return;
    
        const q = query(collection(db, 'hosts'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const hostsData: Omit<Host, 'id' | 'email'>[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                hostsData.push({ name: data.name, department: data.department });
            });
            setHosts(hostsData);
        });
    
        return () => unsubscribe();
    }, [db]);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            visitorName: "",
            companyName: "",
            purposeOfVisit: "",
            department: "",
            privacyPolicy: false,
        },
    });

    const privacyPolicyAccepted = form.watch('privacyPolicy');

    const findPreviousVisit = async (visitorName: string) => {
        if (!db || visitorName.length < 2) return;
    
        try {
            const q = query(
                collection(db, "visits"),
                where("visitorName", "==", visitorName),
                where("entryType", "==", "Personal"),
                orderBy("entryDateTime", "desc"),
                limit(1)
            );
    
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                const lastVisit = querySnapshot.docs[0].data();
                
                if (lastVisit.companyName) {
                    form.setValue("companyName", lastVisit.companyName, { shouldValidate: true });
                }
                if (lastVisit.hostName) {
                    form.setValue("hostName", lastVisit.hostName, { shouldValidate: true });
                    
                    const selectedHost = hosts.find(h => h.name === lastVisit.hostName);
                    if (selectedHost) {
                        form.setValue('department', selectedHost.department || '', { shouldValidate: true });
                    }
                }
            }
        } catch (error) {
            console.error("Error searching for previous visit:", error);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!db) {
            toast({
                title: "Error",
                description: "La base de datos no está disponible.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Check for active visit before registering
            const activeVisitQuery = query(collection(db, "visits"), where("visitorName", "==", values.visitorName));
            const activeVisitSnapshot = await getDocs(activeVisitQuery);

            const activeVisits = activeVisitSnapshot.docs.filter(doc => !doc.data().exitDateTime);

            if (activeVisits.length > 0) {
                toast({
                    title: "Visita Activa",
                    description: `Ya existe una entrada activa para ${values.visitorName}. Debe registrar la salida antes de volver a entrar.`,
                    variant: "destructive",
                });
                return;
            }

            const { privacyPolicy, ...dataToSave } = values;
            await addDoc(collection(db, "visits"), {
                ...dataToSave,
                entryType: 'Personal',
                entryDateTime: new Date().toISOString(),
            });

            toast({
                title: "Bienvenido/a a Robama",
                description: `El registro de ${values.visitorName} se ha completado.`,
            });
            form.reset();
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            console.error("Error adding document: ", error);
            toast({
                title: "Error al registrar",
                description: "Ocurrió un error al guardar la visita. Por favor, inténtelo de nuevo.",
                variant: "destructive"
            });
        }
    }

    if (!isClient) {
        return null;
    }

    return (
        <div className="flex justify-center">
            <AlertDialog>
                <Card className="w-full max-w-lg">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardHeader>
                                <CardTitle className="text-2xl md:text-3xl">Registro de Visita Personal</CardTitle>
                                <CardDescription className="md:text-base">Complete los datos para registrar la entrada del visitante.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="visitorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">Nombre y Apellidos</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Ej: Ana Gómez" 
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur(e);
                                                        findPreviousVisit(e.target.value);
                                                    }}
                                                    autoComplete="off" 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">Empresa</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Soluciones Tech" {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="hostName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">Persona a visitar</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                const selectedHost = hosts.find(h => h.name === value);
                                                if (selectedHost) {
                                                    form.setValue('department', selectedHost.department || '', { shouldValidate: true });
                                                }
                                            }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione una persona" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {hosts.map(host => (
                                                        <SelectItem key={host.name} value={host.name}>
                                                            {host.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">Departamento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Departamento" {...field} disabled />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="purposeOfVisit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">Motivo de la visita</FormLabel>
                                            <FormControl>
                                                <Input {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="privacyPolicy"
                                    render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                        <AlertDialogTrigger asChild>
                                            <FormLabel className="cursor-pointer hover:underline md:text-base">
                                                He leído y acepto la Política de tratamiento de datos.
                                            </FormLabel>
                                        </AlertDialogTrigger>
                                        <FormMessage />
                                        </div>
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting || !privacyPolicyAccepted}>
                                    {form.formState.isSubmitting ? 'Registrando...' : 'Registrar Entrada'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Política de Tratamiento de Datos</AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground max-h-[60vh] overflow-y-auto">
                        En cumplimiento del artículo 13 del Reglamento General de Protección de Datos (Reglamento UE 2016/679), y del artículo 11 de la Ley Orgánica de Protección de Datos Personales y garantía de los Derechos digitales (LO 3/2018), S.A. ROBAMA, le informa que sus datos serán tratados para el registro y control de las visitas que accedan a las instalaciones. La base jurídica del tratamiento es el interés legítimo. Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad anteriormente descrita. Los datos no serán cedidos a terceros salvo existencia de obligación legal. Podrá ejercitar sus derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición, oposición a decisiones individuales automatizadas, incluida la elaboración de perfiles o la portabilidad de sus datos dirigiéndose a info@robama.com. En todo caso, puede recabar la tutela de las autoridades de protección de datos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>Cerrar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

const formSchema = z.object({
  visitorName: z.string().min(2, "El nombre y apellidos deben tener al menos 2 caracteres."),
});

export default function SalidaPage() {
    const db = useFirestore();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            visitorName: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!db) {
            toast({
                title: "Error",
                description: "La base de datos no está disponible.",
                variant: "destructive"
            });
            return;
        }

        const { visitorName } = values;

        try {
            const q = query(collection(db, "visits"), where("visitorName", "==", visitorName));
            
            const querySnapshot = await getDocs(q);
            
            // Filter for visits that are still inside (no exitDateTime)
            const activeVisits = querySnapshot.docs.filter(doc => !doc.data().exitDateTime);

            if (activeVisits.length === 0) {
                toast({
                    title: "Entrada no registrada",
                    description: "No se encontró una entrada activa para este visitante.",
                    variant: "destructive",
                });
                return;
            }

            // Find the most recent visit if there are multiple
            activeVisits.sort((a, b) => new Date(b.data().entryDateTime).getTime() - new Date(a.data().entryDateTime).getTime());
            
            const visitToUpdate = activeVisits[0];

            await updateDoc(doc(db, "visits", visitToUpdate.id), {
                exitDateTime: new Date().toISOString(),
            });

            toast({
                title: "Salida Registrada",
                description: `Se ha registrado la salida para ${visitToUpdate.data().visitorName}.`,
            });
            form.reset();
            setTimeout(() => {
                router.push('/dashboard/registros');
            }, 1000);

        } catch (error) {
            console.error("Error updating document: ", error);
            toast({
                title: "Error al registrar salida",
                description: "Ocurrió un error al guardar la salida. Por favor, inténtelo de nuevo.",
                variant: "destructive"
            });
        }
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-lg">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Registrar Salida</CardTitle>
                            <CardDescription>
                                Ingrese el nombre y apellidos del visitante para registrar su salida.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="visitorName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre y Apellidos</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Juan Pérez" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Registrando...' : 'Registrar Salida'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

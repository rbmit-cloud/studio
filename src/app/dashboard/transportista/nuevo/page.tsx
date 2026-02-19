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

const formSchema = z.object({
  visitorName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  companyName: z.string().min(2, "La empresa debe tener al menos 2 caracteres."),
  purposeOfVisit: z.string().min(5, "El propósito debe tener al menos 5 caracteres."),
  vehicleType: z.string().min(2, "El tipo de vehículo es requerido."),
  licensePlate: z.string().min(5, "La patente debe tener al menos 5 caracteres.").regex(/^[A-Z0-9-]{5,10}$/, 'Formato de patente inválido.'),
});

export default function TransportistaFormPage() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            visitorName: "",
            companyName: "",
            purposeOfVisit: "Entrega de mercadería",
            vehicleType: "",
            licensePlate: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Registro Exitoso",
            description: `El transportista ${values.visitorName} ha sido registrado.`,
        });
        form.reset();
        setTimeout(() => {
            router.push('/dashboard/registros');
        }, 1000);
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-2xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Registro de Transportista</CardTitle>
                            <CardDescription>Complete los datos para registrar la entrada del vehículo y conductor.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="visitorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Conductor</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Juan Pérez" {...field} />
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
                                            <FormLabel>Empresa de Transporte</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Transportes Rápidos S.A." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="vehicleType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo de Vehículo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Camión, Furgoneta" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="licensePlate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Patente del Vehículo</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: AA-123-BB" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="purposeOfVisit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Propósito de la Visita</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Registrando...' : 'Registrar Entrada'}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

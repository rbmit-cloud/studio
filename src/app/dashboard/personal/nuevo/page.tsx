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

const hosts = [
    { name: 'Carlos Rodríguez', department: 'Ventas' },
    { name: 'Ana Martínez', department: 'Recursos Humanos' },
    { name: 'Luis García', department: 'Tecnología' },
    { name: 'Sofía López', department: 'Marketing' },
    { name: 'Javier Fernández', department: 'Administración' },
];

const formSchema = z.object({
  visitorName: z.string().min(2, "El nombre y apellidos deben tener al menos 2 caracteres."),
  companyName: z.string().min(2, "La empresa debe tener al menos 2 caracteres."),
  purposeOfVisit: z.string().min(5, "El motivo de la visita debe tener al menos 5 caracteres."),
  hostName: z.string({
    required_error: "Debe seleccionar una persona a visitar.",
  }),
  department: z.string().min(2, "El departamento es requerido."),
  privacyPolicy: z.boolean().refine(val => val === true, {
    message: "Debe aceptar la política de tratamiento de datos.",
  }),
});

export default function PersonalFormPage() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            visitorName: "",
            companyName: "",
            purposeOfVisit: "Reunión de negocios",
            department: "",
            privacyPolicy: false,
        },
    });

    const privacyPolicyAccepted = form.watch('privacyPolicy');

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        toast({
            title: "Registro Exitoso",
            description: `La visita de ${values.visitorName} ha sido registrada.`,
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
                            <CardTitle>Registro de Visita Personal</CardTitle>
                            <CardDescription>Complete los datos para registrar la entrada del visitante.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="visitorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre y Apellidos</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Ana Gómez" {...field} />
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
                                            <FormLabel>Empresa</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Soluciones Tech" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="hostName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Persona a visitar</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                const selectedHost = hosts.find(h => h.name === value);
                                                if (selectedHost) {
                                                    form.setValue('department', selectedHost.department, { shouldValidate: true });
                                                }
                                            }} defaultValue={field.value}>
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
                                            <FormLabel>Departamento</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Departamento" {...field} disabled />
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
                                        <FormLabel>Motivo de la visita</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                    <FormLabel>
                                        He leído y acepto la Política de tratamiento de datos.
                                    </FormLabel>
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
        </div>
    );
}
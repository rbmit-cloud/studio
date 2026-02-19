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
import { useFirestore } from "@/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Host } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  department: z.string().min(2, "El departamento debe tener al menos 2 caracteres."),
  email: z.string().email("Debe ser un correo electrónico válido."),
});

export default function AjustesPage() {
  const db = useFirestore();
  const [hosts, setHosts] = useState<(Host)[]>([]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "hosts"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hostsData: Host[] = [];
      snapshot.forEach((doc) => {
        hostsData.push({ id: doc.id, ...doc.data() } as Host);
      });
      setHosts(hostsData);
    });

    return () => unsubscribe();
  }, [db]);

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
      await addDoc(collection(db, "hosts"), values);
      toast({
        title: "Anfitrión Añadido",
        description: `Se ha añadido a ${values.name} a la lista de anfitriones.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: "Error al añadir anfitrión",
        description: "Ocurrió un error al guardar. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  }

  async function deleteHost(hostId: string) {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "hosts", hostId));
        toast({
            title: "Anfitrión Eliminado",
            description: "El anfitrión ha sido eliminado correctamente.",
        });
    } catch (error) {
        console.error("Error deleting document: ", error);
        toast({
            title: "Error al eliminar",
            description: "No se pudo eliminar el anfitrión.",
            variant: "destructive",
        });
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Mantenimiento de Anfitriones</CardTitle>
              <CardDescription>Añada o elimine personas que pueden ser visitadas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ventas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: ana.gomez@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Guardando...' : 'Añadir Anfitrión'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Anfitriones</CardTitle>
          <CardDescription>Personas actualmente disponibles para visitas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.length > 0 ? (
                hosts.map((host) => (
                  <TableRow key={host.id}>
                    <TableCell className="font-medium">{host.name}</TableCell>
                    <TableCell>{host.department}</TableCell>
                    <TableCell className="hidden sm:table-cell">{host.email}</TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente al anfitrión.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteHost(host.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Eliminar
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No hay anfitriones registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

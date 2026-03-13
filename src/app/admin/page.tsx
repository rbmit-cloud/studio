'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { addDoc, collection, onSnapshot, query, orderBy, doc, deleteDoc, where, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { Host } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  department: z.string().optional(),
  email: z.string().email("Debe ser un correo electrónico válido.").or(z.literal("")).optional(),
  sendRecords: z.boolean().default(false).optional(),
  sendEntryNotification: z.boolean().default(false).optional(),
});


export default function AjustesPage() {
  const db = useFirestore();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "",
      email: "",
      sendRecords: false,
      sendEntryNotification: false,
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
    }, (error) => {
        console.error("Error fetching hosts:", error);
        toast({
            title: "Error al cargar anfitriones",
            description: "No se pudieron cargar los datos. Por favor, recargue la página.",
            variant: "destructive"
        });
    });

    return () => unsubscribe();
  }, [db, toast]);

  const handleCancelEdit = () => {
    setSelectedHost(null);
    form.reset({
        name: "",
        department: "",
        email: "",
        sendRecords: false,
        sendEntryNotification: false,
    });
  };

  const handleSelectHost = (host: Host) => {
    setSelectedHost(host);
    form.reset({ ...host, email: host.email || '', sendRecords: host.sendRecords || false, sendEntryNotification: host.sendEntryNotification || false });
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar a la base de datos.",
        variant: "destructive"
      });
      return;
    }
  
    try {
      const hostsRef = collection(db, "hosts");
      
      const nameQuery = query(hostsRef, where("name", "==", values.name));
      const nameSnapshot = await getDocs(nameQuery);
      const duplicateName = nameSnapshot.docs.find(doc => doc.id !== selectedHost?.id);
      if (duplicateName) {
        toast({
          title: "Anfitrión Duplicado",
          description: "Ya existe un anfitrión con ese nombre.",
          variant: "destructive",
        });
        return;
      }

      if (values.email) {
        const emailQuery = query(hostsRef, where("email", "==", values.email));
        const emailSnapshot = await getDocs(emailQuery);
        const duplicateEmail = emailSnapshot.docs.find(doc => doc.id !== selectedHost?.id);
        if (duplicateEmail) {
          toast({
            title: "Correo Duplicado",
            description: "Ya existe un anfitrión con ese correo electrónico.",
            variant: "destructive",
          });
          return;
        }
      }
      
      const dataToSave: Omit<Host, 'id'> = {
        name: values.name,
        department: values.department || "",
        email: values.email || "",
        sendRecords: values.sendRecords || false,
        sendEntryNotification: values.sendEntryNotification || false,
      };

      if (selectedHost) {
        const hostDocRef = doc(db, "hosts", selectedHost.id);
        await updateDoc(hostDocRef, dataToSave as any); // Use 'as any' to bypass strict type checking for update
        toast({
            title: "Anfitrión Actualizado",
            description: `Se ha actualizado a ${values.name}.`,
        });
      } else {
        await addDoc(hostsRef, dataToSave);
        toast({
          title: "Anfitrión Añadido",
          description: `Se ha añadido a ${values.name} a la lista de anfitriones.`,
        });
      }
      
      handleCancelEdit();

    } catch (error: any) {
      console.error("Error submitting form: ", error);
      toast({
        title: selectedHost ? "Error al actualizar" : "Error al añadir anfitrión",
        description: error.message || "Ocurrió un error. Por favor, inténtelo de nuevo.",
        variant: "destructive"
      });
    }
  }

  async function deleteHost(hostId: string) {
    if (!db) {
        toast({
            title: "Error de conexión",
            description: "No se pudo conectar a la base de datos.",
            variant: "destructive"
        });
        return;
    }
    try {
        await deleteDoc(doc(db, "hosts", hostId));
        toast({
            title: "Anfitrión Eliminado",
            description: "El anfitrión ha sido eliminado correctamente.",
        });
        if (selectedHost?.id === hostId) {
            handleCancelEdit();
        }
    } catch (error: any) {
        console.error("Error deleting document: ", error);
        toast({
            title: "Error al eliminar",
            description: error.message || "No se pudo eliminar el anfitrión.",
            variant: "destructive",
        });
    }
  }

  const handleExportHostsXlsx = () => {
    if (!hosts || hosts.length === 0) {
        toast({ title: 'No hay anfitriones para exportar.', variant: 'destructive' });
        return;
    }
    const dataToExport = hosts.map(host => ({
        'Nombre': host.name,
        'Departamento': host.department,
        'Email': host.email,
        'Enviar Registros': host.sendRecords ? 'Sí' : 'No',
        'Recibir Notif. Entrada': host.sendEntryNotification ? 'Sí' : 'No',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Anfitriones");
    XLSX.writeFile(workbook, "anfitriones.xlsx");
};

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{selectedHost ? 'Editar Anfitrión' : 'Añadir Nuevo Anfitrión'}</CardTitle>
              <CardDescription>{selectedHost ? 'Modifique los datos del anfitrión y guarde los cambios.' : 'Añada o elimine personas que pueden ser visitadas.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre y Apellidos</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ana Gómez" {...field} autoComplete="off" />
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
                    <FormLabel>Departamento (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Ventas" {...field} autoComplete="off" />
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
                      <Input type="email" placeholder="Ej: ana.gomez@empresa.com" {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sendRecords"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enviar Registros
                      </FormLabel>
                      <FormDescription>
                        Si está marcado, se enviarán informes de visitas por correo electrónico a este anfitrión.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="sendEntryNotification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Recibir notificación de entrada
                      </FormLabel>
                      <FormDescription>
                        Si está marcado, se enviará un email cuando un visitante se registre para verle.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Guardando...' : (selectedHost ? 'Actualizar Anfitrión' : 'Añadir Anfitrión')}
                </Button>
              {selectedHost && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar Edición
                </Button>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Anfitriones</CardTitle>
              <CardDescription>Personas actualmente disponibles para visitas. Haga clic en una fila para editar.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportHostsXlsx}>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar XLSX
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Enviar Registros</TableHead>
                <TableHead>Notif. Entrada</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.length > 0 ? (
                hosts.map((host) => (
                  <TableRow 
                    key={host.id}
                    onClick={() => handleSelectHost(host)}
                    className={cn(
                        "cursor-pointer",
                        selectedHost?.id === host.id && "bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium">
                        {host.name}
                    </TableCell>
                    <TableCell>{host.department}</TableCell>
                    <TableCell className="hidden sm:table-cell">{host.email}</TableCell>
                    <TableCell>{host.sendRecords ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{host.sendEntryNotification ? 'Sí' : 'No'}</TableCell>
                    <TableCell className="text-right">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
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
                                <AlertDialogAction onClick={(e) => { e.stopPropagation(); deleteHost(host.id); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                  <TableCell colSpan={6} className="h-24 text-center">
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

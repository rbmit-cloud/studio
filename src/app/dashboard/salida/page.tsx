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
import { useLanguage, getZodSchema } from "@/context/language-context";
import { useMemo } from "react";

export default function SalidaPage() {
    const { t } = useLanguage();
    const formSchema = useMemo(() => getZodSchema(t).salida, [t]);
    const db = useFirestore();
    const router = useRouter();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
        defaultValues: {
            visitorName: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!db) {
            toast({
                title: t('dbError'),
                description: t('dbUnavailable'),
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
                    title: t('exitRegistrationErrorTitle'),
                    description: t('exitRegistrationErrorDescription'),
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
                title: t('exitSuccessTitle'),
                description: t('exitSuccessDescription', { visitorName: visitToUpdate.data().visitorName }),
            });
            form.reset();
            setTimeout(() => {
                router.push('/');
            }, 1000);

        } catch (error) {
            console.error("Error updating document: ", error);
            toast({
                title: t('registrationError'),
                description: t('registrationErrorDescription'),
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
                            <CardTitle>{t('registerExitTitle')}</CardTitle>
                            <CardDescription>
                                {t('registerExitDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="visitorName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('fullName')}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('exitFullNamePlaceholder')} {...field} autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()}>{t('cancel')}</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t('registering') : t('registerExitButton')}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

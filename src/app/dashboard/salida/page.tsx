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
import { useFirestore, useUser } from "@/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { useLanguage, getZodSchema } from "@/context/language-context";
import { useMemo, useEffect, useState } from "react";
import { useEnvironment } from "@/context/environment-context";
import type { Visitor } from "@/lib/types";
import { sendExitNotificationEmail } from "@/app/actions/send-exit-notification";

export default function SalidaPage() {
    const { t } = useLanguage();
    const formSchema = useMemo(() => getZodSchema(t).salida, [t]);
    const db = useFirestore();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const { environment, visitsCollection } = useEnvironment();
    const { isUserLoading } = useUser();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        let inactivityTimer: NodeJS.Timeout;

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                router.push('/');
            }, 1 * 60 * 1000); // 1 minute
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
            const q = query(collection(db, visitsCollection), where("visitorName", "==", visitorName));
            
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
            const visitData = visitToUpdate.data() as Visitor;
            const newExitDateTime = new Date().toISOString();

            await updateDoc(doc(db, visitsCollection, visitToUpdate.id), {
                exitDateTime: newExitDateTime,
            });

            if (visitData.hostName) {
                sendExitNotificationEmail({
                    visitorName: visitData.visitorName,
                    companyName: visitData.companyName,
                    hostName: visitData.hostName,
                    entryDateTime: visitData.entryDateTime,
                    exitDateTime: newExitDateTime,
                    environment: environment
                }).then(result => {
                    if (!result.success) {
                        console.error("Failed to send exit notification:", result.message);
                    } else {
                        console.log("Exit notification email result:", result.message);
                    }
                });
            }

            toast({
                title: t('exitSuccessTitle'),
                description: t('exitSuccessDescription', { visitorName: visitData.visitorName }),
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

    if (!isClient) {
        return null;
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-lg">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            {environment === 'test' && (
                                <p className="text-center font-bold text-destructive">
                                    ENTORNO TEST ACTIVADO
                                </p>
                            )}
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
                            <Button type="submit" disabled={isUserLoading || form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? t('registering') : t('registerExitButton')}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

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
import { useEffect, useState, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { Host } from "@/lib/types";
import { useLanguage, getZodSchema } from "@/context/language-context";
import { sendEntryNotificationEmail } from "@/app/actions/send-entry-notification";

export default function PersonalFormPage() {
    const { t } = useLanguage();
    const formSchema = useMemo(() => getZodSchema(t).personal, [t]);

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
        mode: "onSubmit",
        defaultValues: {
            visitorName: "",
            companyName: "",
            purposeOfVisit: "",
            hostName: undefined,
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
                    form.setValue("companyName", lastVisit.companyName);
                }
                if (lastVisit.hostName) {
                    form.setValue("hostName", lastVisit.hostName);
                    
                    const selectedHost = hosts.find(h => h.name === lastVisit.hostName);
                    if (selectedHost) {
                        form.setValue('department', selectedHost.department || '');
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
                title: t('dbError'),
                description: t('dbUnavailable'),
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
                    title: t('activeVisitTitle'),
                    description: t('activeVisitError', { visitorName: values.visitorName }),
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

            // Send notification email without blocking UI
            sendEntryNotificationEmail({
                ...dataToSave,
                entryType: 'Personal',
            }).then(result => {
                if (!result.success) {
                    console.error("Failed to send visit notification:", result.message);
                } else {
                    console.log("Visit notification email result:", result.message);
                }
            });


            toast({
                title: t('welcomeMessage'),
                description: t('registrationComplete', { visitorName: values.visitorName }),
            });
            form.reset();
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            console.error("Error adding document: ", error);
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
        <div className="flex justify-center w-full">
            <AlertDialog>
                <Card className="w-full max-w-lg">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardHeader>
                                <CardTitle className="text-2xl md:text-3xl">{t('personalVisitRegistration')}</CardTitle>
                                <CardDescription className="md:text-base">{t('personalVisitDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="visitorName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="md:text-base">{t('fullName')}</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder={t('fullNamePlaceholder')} 
                                                    {...field}
                                                    onBlur={(e) => {
                                                        field.onBlur();
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
                                            <FormLabel className="md:text-base">{t('company')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('companyPlaceholder')} {...field} autoComplete="off" />
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
                                            <FormLabel className="md:text-base">{t('personToVisit')}</FormLabel>
                                            <Select onValueChange={(value) => {
                                                field.onChange(value);
                                                const selectedHost = hosts.find(h => h.name === value);
                                                if (selectedHost) {
                                                    form.setValue('department', selectedHost.department || '');
                                                }
                                            }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('selectPerson')} />
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
                                            <FormLabel className="md:text-base">{t('department')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={t('departmentPlaceholder')} {...field} disabled />
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
                                            <FormLabel className="md:text-base">{t('purposeOfVisit')}</FormLabel>
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
                                                {t('privacyPolicy')}
                                            </FormLabel>
                                        </AlertDialogTrigger>
                                        <FormMessage />
                                        </div>
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => router.back()}>{t('cancel')}</Button>
                                <Button type="submit" disabled={form.formState.isSubmitting || !privacyPolicyAccepted}>
                                    {form.formState.isSubmitting ? t('registering') : t('registerEntry')}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('privacyPolicyTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-foreground max-h-[60vh] overflow-y-auto">
                        {t('privacyPolicyContent')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction>{t('close')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

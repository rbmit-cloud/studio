'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { z } from 'zod';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: {[key: string]: string}) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // page.tsx
    'personalEntry': 'Entrada Personal',
    'transporterEntry': 'Entrada Transportista',
    'registerExit': 'Registrar Salida',
    'viewVisitLog': 'Ver Registro de Visitas',
    'administration': 'Administración',
    'restrictedAccess': 'Acceso Restringido',
    'enterCredentials': 'Ingrese sus credenciales para acceder a esta sección.',
    'email': 'Correo Electrónico',
    'password': 'Contraseña',
    'login': 'Iniciar Sesión',

    // personal/nuevo/page.tsx
    'personalVisitRegistration': 'Registro de Visita Personal',
    'personalVisitDescription': 'Complete los datos para registrar la entrada del visitante.',
    'fullName': 'Nombre y Apellidos',
    'fullNamePlaceholder': 'Ej: Ana Gómez',
    'company': 'Empresa',
    'companyPlaceholder': 'Ej: Soluciones Tech',
    'personToVisit': 'Persona a visitar',
    'selectPerson': 'Seleccione una persona',
    'department': 'Departamento',
    'departmentPlaceholder': 'Departamento',
    'purposeOfVisit': 'Motivo de la visita',
    'privacyPolicy': 'He leído y acepto la Política de tratamiento de datos.',
    'cancel': 'Cancelar',
    'registerEntry': 'Registrar Entrada',
    'registering': 'Registrando...',
    'privacyPolicyTitle': 'Política de Tratamiento de Datos',
    'privacyPolicyContent': 'En cumplimiento del artículo 13 del Reglamento General de Protección de Datos (Reglamento UE 2016/679), y del artículo 11 de la Ley Orgánica de Protección de Datos Personales y garantía de los Derechos digitales (LO 3/2018), S.A. ROBAMA, le informa que sus datos serán tratados para el registro y control de las visitas que accedan a las instalaciones. La base jurídica del tratamiento es el interés legítimo. Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad anteriormente descrita. Los datos no serán cedidos a terceros salvo existencia de obligación legal. Podrá ejercitar sus derechos de acceso, rectificación, supresión, limitación del tratamiento, oposición, oposición a decisiones individuales automatizadas, incluida la elaboración de perfiles o la portabilidad de sus datos dirigiéndose a info@robama.com. En todo caso, puede recabar la tutela de las autoridades de protección de datos.',
    'close': 'Cerrar',
    'activeVisitTitle': 'Visita Activa',
    'activeVisitError': 'Ya existe una entrada activa para {visitorName}. Debe registrar la salida antes de volver a entrar.',
    'welcomeMessage': 'Bienvenido/a a Robama',
    'registrationComplete': 'El registro de {visitorName} se ha completado.',
    'sessionInactive': 'Sesión inactiva',
    'redirectingToMain': 'Regresando a la pantalla principal.',

    // transportista/nuevo/page.tsx
    'transporterRegistration': 'Registro de Transportista',
    'transporterRegistrationDescription': 'Complete los datos para registrar la entrada del vehículo y conductor.',
    'transporterFullNamePlaceholder': 'Ej: Juan Pérez',
    'transportCompany': 'Empresa de Transportes',
    'transportCompanyPlaceholder': 'Ej: Transportes Rápidos S.A.',
    'licensePlate': 'Matrícula',
    'licensePlatePlaceholder': 'Ej: AA-123-BB',
    'trailerLicensePlate': 'Matrícula Remolque (Opcional)',
    'trailerLicensePlatePlaceholder': 'Ej: R-456-CC',
    'purposeOfVisitPlaceholder': 'Ej: Entrega de mercancía',
    'transporterWelcome': 'El registro del transportista {visitorName} se ha completado.',

    // salida/page.tsx
    'registerExitTitle': 'Registrar Salida',
    'registerExitDescription': 'Ingrese el nombre y apellidos del visitante para registrar su salida.',
    'exitFullNamePlaceholder': 'Ej: Juan Pérez',
    'registerExitButton': 'Registrar Salida',
    'exitRegistrationErrorTitle': 'Entrada no registrada',
    'exitRegistrationErrorDescription': 'No se encontró una entrada activa para este visitante.',
    'exitSuccessTitle': 'Gracias por su visita',
    'exitSuccessDescription': 'Se ha registrado la salida para {visitorName}.',

    // Shared Zod Messages
    'nameMinChars': 'El nombre y apellidos deben tener al menos 2 caracteres.',
    'companyMinChars': 'La empresa debe tener al menos 2 caracteres.',
    'hostRequired': 'Debe seleccionar una persona a visitar.',
    'privacyPolicyRequired': 'Debe aceptar la política de tratamiento de datos.',
    'licensePlateMinChars': 'La matrícula debe tener al menos 5 caracteres.',
    'invalidLicensePlate': 'Formato de matrícula inválido.',
  },
  en: {
    // page.tsx
    'personalEntry': 'Personal Entry',
    'transporterEntry': 'Transporter Entry',
    'registerExit': 'Register Exit',
    'viewVisitLog': 'View Visit Log',
    'administration': 'Administration',
    'restrictedAccess': 'Restricted Access',
    'enterCredentials': 'Enter your credentials to access this section.',
    'email': 'Email',
    'password': 'Password',
    'login': 'Login',

    // personal/nuevo/page.tsx
    'personalVisitRegistration': 'Personal Visit Registration',
    'personalVisitDescription': 'Complete the details to register the visitor\'s entry.',
    'fullName': 'Full Name',
    'fullNamePlaceholder': 'E.g., Jane Doe',
    'company': 'Company',
    'companyPlaceholder': 'E.g., Tech Solutions',
    'personToVisit': 'Person to visit',
    'selectPerson': 'Select a person',
    'department': 'Department',
    'departmentPlaceholder': 'Department',
    'purposeOfVisit': 'Purpose of visit',
    'privacyPolicy': 'I have read and accept the data processing policy.',
    'cancel': 'Cancel',
    'registerEntry': 'Register Entry',
    'registering': 'Registering...',
    'privacyPolicyTitle': 'Data Processing Policy',
    'privacyPolicyContent': 'In compliance with Article 13 of the General Data Protection Regulation (EU Regulation 2016/679), and Article 11 of the Organic Law on Personal Data Protection and guarantee of Digital Rights (LO 3/2018), S.A. ROBAMA, informs you that your data will be processed for the registration and control of visits accessing the facilities. The legal basis for the processing is legitimate interest. The data will be kept for the time necessary to fulfill the purpose described above. The data will not be transferred to third parties unless there is a legal obligation. You may exercise your rights of access, rectification, deletion, limitation of processing, opposition, opposition to automated individual decisions, including profiling, or the portability of your data by contacting info@robama.com. In any case, you can seek the protection of data protection authorities.',
    'close': 'Close',
    'activeVisitTitle': 'Active Visit',
    'activeVisitError': 'An active entry already exists for {visitorName}. You must register the exit before re-entering.',
    'welcomeMessage': 'Welcome to Robama',
    'registrationComplete': 'The registration for {visitorName} has been completed.',
    'sessionInactive': 'Inactive session',
    'redirectingToMain': 'Returning to the main screen.',

    // transportista/nuevo/page.tsx
    'transporterRegistration': 'Transporter Registration',
    'transporterRegistrationDescription': 'Complete the details to register the vehicle and driver entry.',
    'transporterFullNamePlaceholder': 'E.g., John Smith',
    'transportCompany': 'Transport Company',
    'transportCompanyPlaceholder': 'E.g., Fast Transports Inc.',
    'licensePlate': 'License Plate',
    'licensePlatePlaceholder': 'E.g., AB-123-CD',
    'trailerLicensePlate': 'Trailer License Plate (Optional)',
    'trailerLicensePlatePlaceholder': 'E.g., T-456-EF',
    'purposeOfVisitPlaceholder': 'E.g., Merchandise delivery',
    'transporterWelcome': 'The registration for transporter {visitorName} has been completed.',

    // salida/page.tsx
    'registerExitTitle': 'Register Exit',
    'registerExitDescription': 'Enter the visitor\'s full name to register their exit.',
    'exitFullNamePlaceholder': 'E.g., John Smith',
    'registerExitButton': 'Register Exit',
    'exitRegistrationErrorTitle': 'Entry not registered',
    'exitRegistrationErrorDescription': 'No active entry was found for this visitor.',
    'exitSuccessTitle': 'Thank you for your visit',
    'exitSuccessDescription': 'The exit for {visitorName} has been registered.',
    
    // Shared Zod Messages
    'nameMinChars': 'Full name must be at least 2 characters.',
    'companyMinChars': 'Company name must be at least 2 characters.',
    'hostRequired': 'You must select a person to visit.',
    'privacyPolicyRequired': 'You must accept the data processing policy.',
    'licensePlateMinChars': 'License plate must be at least 5 characters.',
    'invalidLicensePlate': 'Invalid license plate format.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string, replacements: {[key: string]: string} = {}): string => {
    let translation = translations[language][key] || key;
    Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{${rKey}}`, replacements[rKey]);
    });
    return translation;
  }, [language]);
  
  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Function to get a Zod schema based on the current language
export const getZodSchema = (t: (key: string, replacements?: {[key: string]: string}) => string) => ({
    personal: z.object({
        visitorName: z.string().min(2, t('nameMinChars')),
        companyName: z.string().min(2, t('companyMinChars')),
        purposeOfVisit: z.string(),
        hostName: z.string({
          required_error: t('hostRequired'),
        }),
        department: z.string().optional(),
        privacyPolicy: z.boolean().refine(val => val === true, {
          message: t('privacyPolicyRequired'),
        }),
    }),
    transportista: z.object({
        visitorName: z.string().min(2, t('nameMinChars')),
        companyName: z.string().min(2, t('companyMinChars')),
        licensePlate: z.string().min(5, t('licensePlateMinChars')).regex(/^[A-Z0-9-]{5,10}$/, t('invalidLicensePlate')),
        trailerLicensePlate: z.string().optional(),
        purposeOfVisit: z.string(),
        hostName: z.string({
          required_error: t('hostRequired'),
        }),
        department: z.string().optional(),
        privacyPolicy: z.boolean().refine(val => val === true, {
          message: t('privacyPolicyRequired'),
        }),
    }),
    salida: z.object({
        visitorName: z.string().min(2, t('nameMinChars')),
    }),
});

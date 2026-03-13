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
    'safetyRegulationsTitle': 'NORMAS DE SEGURIDAD PARA VISITAS Y EMPRESAS EXTERNAS',
    'safetyRegulationsContent': `Bienvenido a S.A. ROBAMA:
Conforme a lo establecido en el Artículo 24 de la Ley de Prevención de Riesgos Laborales (Ley 31/1995) y al Real Decreto 171/2004 de Coordinación de Actividades Empresariales, se proporcionan en este documento las instrucciones básicas de Seguridad y Salud Laboral que deberán seguir las visitas y las empresas externas:

• Debe registrarse en Recepción toda entrada y salida que realice en nuestras instalaciones para que en caso de una Emergencia sepamos de su presencia. En caso de encontrarse fuera del horario de oficinas (de 08:00 a 13:00 y de 14:00 a 17:00 h.), informe al Encargado de Fabricación/ Almacén.
• Antes de comenzar el trabajo en nuestras instalaciones, la empresa contratada debe asegurarse de que todo su personal tenga formación e información suficiente acerca de sus propios riesgos laborales y las correspondientes medidas de prevención, y que disponen de los EPis (calzado de seguridad, mascarilla de protección respiratoria, guantes, gafas, arnés, ... ) y las protecciones colectivas necesarias (vallas, redes, ...).
• Conforme al deber de vigilancia, S.A. ROBAMA se reserva el derecho de parar los trabajos, rechazar trabajadores e invitar a abandonar las instalaciones, a aquellas empresas o trabajadores que incumplan la normativa en prevención de riesgos laborales, sin perjuicio en el precio final del servicio contratado.
• Se deberá informar por escrito al Responsable de Prevención de Riesgos Laborales de S.A. ROBAMA de todos los accidentes e incidentes que tenga el personal de la empresa contratista en un plazo máximo de 24 horas.
• La empresa contratista deberá nombrar un responsable de su plantilla para vigilar y hacer cumplir las normas de seguridad.
• No está permitido el uso de cámaras de fotos o cualquier otro sistema de grabación, salvo autorización previa.

MEDIDAS GENERALES DE SEGURIDAD

• Respete las normas de seguridad y la señalización existente del área donde se encuentre.
• No deberá permanecer en otros lugares distintos a aquellos en los que realice su trabajo sin estar acompañado por personal de S.A. ROBAMA. Permanezca fuera de las áreas restringidas.
• Es obligatorio el uso de calzado con puntera de seguridad y suela antideslizante, gafas de protección y chaleco reflectante para transitar por la empresa (excepto en la zona de Oficinas).
• Mantenga siempre el orden y la limpieza. No se considerarán acabados los trabajos hasta que el área afectada quede totalmente limpia.
• Inspeccione su puesto de trabajo al final de la jornada laboral y antes de cualquier interrupción (comidas u otras necesidades), procurando no dejar encendidos aparatos eléctricos no vitales.
• La empresa contratada evitará, en la medida de lo posible, la generación de residuos sólidos, líquidos o contaminación del aire. Está completamente prohibido verter residuos líquidos a la red de saneamiento, abandonar residuos en cualquier lugar de la fábrica, quemar cualquier producto, ...
• En nuestras instalaciones hay un gran movimiento de vehículos (carretillas elevadoras, camiones cisterna, ...): respete las vías de circulación habilitadas para vehículos y peatones y manténgase alerta.
• Está prohibido utilizar los vehículos de la empresa (carretillas elevadoras, plataforma elevadora móvil, ...) sin un permiso previo y si no se dispone de formación específica.
• La velocidad máxima de circulación de vehículos está limitada a 10 km/h.
• Está prohibido el uso de carretillas elevadoras para la realización de trabajos en altura, para estos trabajos se utilizarán andamios (que deberán estar homologados y revisados) o plataformas elevadoras homologadas (PEMP).
• Está prohibido utilizar el aire comprimido para la limpieza de ropas, pelo, zonas de trabajo, ....
• No corra, y suba y baje las escaleras sujetándose en la barandilla.
• No pase nunca por debajo de cargas suspendidas ni deje que otros lo hagan.
• Delimite la zona de trabajo con balizas verticales y señalización adecuada a los peligros, prohibiciones y obligaciones que se requieran por la actividad.
• Los equipos de trabajo deben disponer de declaración de conformidad y marcaje CE y tener las protecciones, enchufes, cables, tomas de tierra, ... en buenas condiciones de uso.
• No sobrecargue las tomas de corriente conectando varios aparatos en la misma toma.
• Sin la previa autorización por escrito de S.A. ROBAMA, está prohibido manipular cualquier tipo de instalación o realizar trabajos de especial peligrosidad: trabajos en caliente (de soldadura, corte de metal, ...), trabajos en espacios confinados, trabajos en altura, ...
• En S.A. ROBAMA se manipulan y almacenan productos químicos en polvo y/o líquidos (algunos de ellos peligrosos: tóxicos, corrosivos, inflamables, ... ), extreme las precauciones y no los manipule sin la autorización previa de la empresa.
• En la zona de trabajo no podrán situarse más recipientes de productos químicos, residuos peligrosos o de gases comprimidos que los estrictamente necesarios para la ejecución del trabajo.
• Todas las botellas de gases deberán estar sujetas, y alejadas de puntos calientes. Si no se usan, se retirarán o se podrán almacenar temporalmente en una zona prevista.
• Si detecta cualquier anomalía que pueda afectar a la seguridad, comuníquela al responsable de su área de trabajo o a cualquier empleado de S.A. ROBAMA.
• Está prohibido comer o beber en todo el recinto de la empresa, excepto en las zonas autorizadas y habilitadas (los comedores). Tampoco está permitido el consumo de bebidas alcohólicas.

PLAN DE EMERGENCIA

• Está terminantemente prohibido fumar en toda la empresa. Existe una zona habilitada para fumar, pero es de uso exclusivo para el personal de S.A. ROBAMA.
• No acerque focos de calor a materiales inflamables o combustibles.
• Antes de empezar a trabajar, identifique los medios de lucha contra incendios (extintores, BIEs, ... ) y las vías de evacuación de su zona (señalizadas en los planos de emergencia repartidos por toda la empresa) y familiarícese con ellos.
• Si escucha la alarma de evacuación (sirena continua):
- Pare su trabajo y asegúrese que los equipos de trabajo a su cargo quedan desconectados y en posición segura.
- Diríjase de forma ordenada al Punto de Encuentro (situado junto a la puerta de acceso) siguiendo la vía de evacuación más corta y segura. Permanezca allí hasta recibir nuevas instrucciones. No abandone las instalaciones sin comunicárselo al personal de control.
- Durante la evacuación, no retroceda ni intente recoger sus objetos personales y cierre las puertas a su paso cerciorándose de que no hay nadie en el interior.
- Siga siempre las instrucciones del personal designado para emergencias de S.A. ROBAMA.
• Si es usted quien descubre un incendio:
- Actúe con celeridad y mantenga la calma, comuníquelo al responsable de su área de trabajo o a cualquier empleado de S.A. ROBAMA o accione un pulsador de alarma.
- En ningún caso ponga en peligro su vida.
• Si se encuentra atrapado por el fuego:
- Si la zona se encuentra inundada de humo, desplácese gateando y cúbrase la nariz y boca con un pañuelo u otro tipo de prenda. Evite la extensión del fuego y del humo cerrando puertas y ventanas. Tape las ranuras con trapos, preferiblemente húmedos.`,
    'accept': 'Acepto',

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
    'registrationError': 'Error en el registro',
    'registrationErrorDescription': 'Ocurrió un error al intentar registrar la visita.',
    'dbError': 'Error de base de datos',
    'dbUnavailable': 'La base de datos no está disponible en este momento.',
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
    'safetyRegulationsTitle': 'SAFETY RULES FOR VISITORS AND EXTERNAL COMPANIES',
    'safetyRegulationsContent': `Welcome to S.A. ROBAMA:
In accordance with Article 24 of the Law on Prevention of Occupational Risks (Law 31/1995) and Royal Decree 171/2004 on Coordination of Business Activities, this document provides the basic instructions on Occupational Health and Safety that visitors and external companies must follow:

• You must register every entry and exit you make in our facilities at Reception so that in case of an Emergency we are aware of your presence. If you are outside office hours (from 08:00 to 13:00 and from 14:00 to 17:00), please inform the Manufacturing/Warehouse Manager.
• Before starting work in our facilities, the contracted company must ensure that all its personnel have sufficient training and information about their own occupational risks and the corresponding prevention measures, and that they have the necessary PPE (safety footwear, respiratory protection mask, gloves, glasses, harness, ...) and collective protections (fences, nets, ...).
• In accordance with the duty of vigilance, S.A. ROBAMA reserves the right to stop work, reject workers, and invite companies or workers who do not comply with the occupational risk prevention regulations to leave the facilities, without prejudice to the final price of the contracted service.
• The contractor must inform the Head of Occupational Risk Prevention of S.A. ROBAMA in writing of all accidents and incidents involving the contractor's personnel within a maximum period of 24 hours.
• The contractor must appoint a person in charge from its staff to monitor and enforce safety standards.
• The use of cameras or any other recording system is not permitted without prior authorization.

GENERAL SAFETY MEASURES

• Respect the safety rules and existing signage in the area where you are.
• You should not remain in places other than those where you perform your work without being accompanied by S.A. ROBAMA personnel. Stay out of restricted areas.
• It is mandatory to use footwear with a safety toe and non-slip sole, safety glasses, and a reflective vest to move around the company (except in the Office area).
• Always maintain order and cleanliness. Work will not be considered finished until the affected area is completely clean.
• Inspect your workstation at the end of the workday and before any interruption (meals or other needs), trying not to leave non-vital electrical appliances on.
• The contracted company shall, as far as possible, avoid the generation of solid, liquid waste or air pollution. It is completely forbidden to pour liquid waste into the sanitation network, leave waste anywhere in the factory, burn any product, ...
• There is a lot of vehicle movement in our facilities (forklifts, tankers, ...): respect the circulation routes enabled for vehicles and pedestrians and stay alert.
• It is forbidden to use the company's vehicles (forklifts, mobile elevating work platform, ...) without prior permission and if you do not have specific training.
• The maximum vehicle circulation speed is limited to 10 km/h.
• It is forbidden to use forklifts for work at height; for these jobs, approved and inspected scaffolding or approved mobile elevating work platforms (MEWPs) will be used.
• It is forbidden to use compressed air for cleaning clothes, hair, work areas, ....
• Do not run, and go up and down the stairs holding the handrail.
• Never pass under suspended loads or let others do so.
• Delimit the work area with vertical beacons and adequate signage for the dangers, prohibitions, and obligations required by the activity.
• Work equipment must have a declaration of conformity and CE marking and have the protections, plugs, cables, ground connections, ... in good condition for use.
• Do not overload the power outlets by connecting several devices to the same outlet.
• Without the prior written authorization of S.A. ROBAMA, it is forbidden to handle any type of installation or perform work of special danger: hot work (welding, metal cutting, ...), work in confined spaces, work at height, ...
• At S.A. ROBAMA, chemical products in powder and/or liquid form are handled and stored (some of them hazardous: toxic, corrosive, flammable, ...), take extreme precautions and do not handle them without prior authorization from the company.
• No more containers of chemical products, hazardous waste, or compressed gases than are strictly necessary for the execution of the work may be located in the work area.
• All gas cylinders must be secured and kept away from hot spots. If not in use, they will be removed or may be temporarily stored in a designated area.
• If you detect any anomaly that could affect safety, report it to the person in charge of your work area or to any employee of S.A. ROBAMA.
• It is forbidden to eat or drink throughout the company premises, except in authorized and designated areas (the canteens). The consumption of alcoholic beverages is also not permitted.

EMERGENCY PLAN

• Smoking is strictly prohibited throughout the company. There is a designated smoking area, but it is for the exclusive use of S.A. ROBAMA personnel.
• Do not bring heat sources near flammable or combustible materials.
• Before starting work, identify the firefighting equipment (extinguishers, fire hose reels, ...) and the evacuation routes in your area (marked on the emergency plans distributed throughout the company) and familiarize yourself with them.
• If you hear the evacuation alarm (continuous siren):
- Stop your work and ensure that the work equipment under your charge is disconnected and in a safe position.
- Proceed in an orderly manner to the Assembly Point (located next to the access door) following the shortest and safest evacuation route. Remain there until you receive new instructions. Do not leave the facilities without notifying the control personnel.
- During the evacuation, do not go back or try to collect your personal belongings and close the doors behind you, making sure there is no one inside.
- Always follow the instructions of the personnel designated for emergencies by S.A. ROBAMA.
• If you are the one who discovers a fire:
- Act quickly and remain calm, report it to the person in charge of your work area or to any employee of S.A. ROBAMA or activate an alarm button.
- Under no circumstances put your life in danger.
• If you find yourself trapped by fire:
- If the area is flooded with smoke, crawl and cover your nose and mouth with a handkerchief or other type of garment. Prevent the spread of fire and smoke by closing doors and windows. Cover the cracks with rags, preferably wet.`,
    'accept': 'Accept',

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
    'registrationError': 'Registration Error',
    'registrationErrorDescription': 'An error occurred while trying to register the visit.',
    'dbError': 'Database Error',
    'dbUnavailable': 'The database is currently unavailable.',
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

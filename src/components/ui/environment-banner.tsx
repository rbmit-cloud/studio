'use client';

import { useEnvironment } from '@/context/environment-context';

export function EnvironmentBanner() {
  const { environment } = useEnvironment();

  if (environment !== 'test') {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground text-center p-2 font-bold">
      ENTORNO TEST ACTIVADO
    </div>
  );
}

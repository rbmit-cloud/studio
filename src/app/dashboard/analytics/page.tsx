import { Construction } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 h-[calc(100vh-10rem)] items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <Construction className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">
          Página en Construcción
        </h3>
        <p className="text-sm text-muted-foreground">
          La sección de analíticas está en desarrollo. ¡Vuelve pronto!
        </p>
      </div>
    </div>
  );
}

'use client';

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-4">
            <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={140} height={35} />
        </div>
        <h1 className="flex-1 text-center text-xl font-semibold">Mantenimiento de Anfitriones</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            Salir
            <LogOut className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>
    </div>
  );
}

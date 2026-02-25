'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { List, Truck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/dashboard/registros', icon: List, label: 'Registros' },
  { href: '/dashboard/transportista/nuevo', icon: Truck, label: 'Nuevo Transportista' },
  { href: '/dashboard/personal/nuevo', icon: User, label: 'Nueva Visita' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label || 'Dashboard';

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Image src="/robama-logo.jpg" alt="Logo de Robama S.A." width={140} height={35} className="group-data-[collapsible=icon]:hidden" />
            <div className="bg-primary rounded-lg p-1.5 items-center justify-center hidden group-data-[collapsible=icon]:flex">
                <Truck className="text-primary-foreground h-6 w-6" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{
                    children: item.label,
                    side: 'right',
                  }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden"/>
                <h1 className="text-lg font-semibold">
                    {pageTitle}
                </h1>
            </div>
            <Button asChild variant="outline" size="sm">
                <Link href="/">
                    Salir
                    <LogOut className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

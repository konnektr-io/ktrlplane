import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/AppHeader";
import { Outlet } from "react-router-dom";
import konnektrLogo from "../assets/konnektr.svg";

interface AppLayoutProps {
  sidebarContent: ReactNode;
  showProjectSelector?: boolean;
}

export default function AppLayout({ sidebarContent }: AppLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      storageKey="vite-ui-theme"
    >
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <Sidebar>
            <SidebarHeader className="border-b bg-background px-6 py-4">
              <div className="flex items-center gap-2 h-10">
                <img
                  src={konnektrLogo}
                  alt="Konnektr logo"
                  className="h-7 w-7"
                />
                <span className="font-semibold">ktrlplane</span>
              </div>
            </SidebarHeader>

            <SidebarContent>{sidebarContent}</SidebarContent>
          </Sidebar>

          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader />

            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

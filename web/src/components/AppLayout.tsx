import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/AppHeader";
import { Outlet } from "react-router-dom";


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
      <SidebarProvider className="flex flex-col">
        <div className="sticky top-0 z-40 bg-background w-full">
            <AppHeader />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            className="top-14 h-[calc(100svh-3.5rem)]"
          >
            {/* SidebarHeader removed as branding is now in AppHeader */}
            <SidebarContent>{sidebarContent}</SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col overflow-hidden">
             <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}

import { type ReactNode } from "react";
import { useProjects } from "../features/projects/hooks/useProjectApi";
import { useOrganizations } from "../features/organizations/hooks/useOrganizationApi";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AppHeader from "@/components/AppHeader";
import { Outlet } from "react-router-dom";
import konnektrLogo from "../assets/konnektr.svg";
import { ThemeProvider } from "@/components/theme-provider";

interface AppLayoutProps {
  sidebarContent: ReactNode;
  showProjectSelector?: boolean;
}

export default function AppLayout({
  sidebarContent,
  showProjectSelector = false, // eslint-disable-line @typescript-eslint/no-unused-vars
}: AppLayoutProps) {
  // Fetch organizations and projects using React Query hooks
  useOrganizations();
  const projectsQuery = useProjects(); // eslint-disable-line @typescript-eslint/no-unused-vars
  // Only use projectsQuery data if showProjectSelector is true

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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

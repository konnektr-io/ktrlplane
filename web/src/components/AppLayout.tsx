import { ReactNode, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useOrganizationStore } from '@/store/organizationStore';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar';
import AppHeader from '@/components/AppHeader';
import { Outlet } from 'react-router-dom';

interface AppLayoutProps {
  sidebarContent: ReactNode;
  showProjectSelector?: boolean;
}

export default function AppLayout({ sidebarContent, showProjectSelector = false }: AppLayoutProps) {
  const { fetchProjects } = useProjectStore();
  const { fetchOrganizations } = useOrganizationStore();

  useEffect(() => {
    // Always fetch organizations on layout mount
    fetchOrganizations();
    
    // Fetch projects if we need the project selector
    if (showProjectSelector) {
      fetchProjects();
    }
  }, [fetchOrganizations, fetchProjects, showProjectSelector]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">ktrlplane</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {sidebarContent}
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

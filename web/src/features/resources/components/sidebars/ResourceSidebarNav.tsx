import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { 
  Settings,
  Shield,
  FileText,
  Activity,
  Database
} from 'lucide-react';

const resourceMenuItems = [
  {
    title: 'Overview',
    icon: Database,
    path: '',
  },
  {
    title: 'Access & Permissions', 
    icon: Shield,
    path: 'access',
  },
  {
    title: 'Logs',
    icon: FileText,
    path: 'logs',
  },
  {
    title: 'Monitoring',
    icon: Activity,
    path: 'monitoring',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: 'settings',
  },
];

export default function ResourceSidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, resourceId } = useParams<{ projectId: string; resourceId: string }>();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Resource</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {resourceMenuItems.map((item) => {
            const fullPath = `/projects/${projectId}/resources/${resourceId}${item.path ? `/${item.path}` : ''}`;
            // Allow /projects/:projectId/resources/:resourceId and /projects/:projectId/resources/:resourceId/ to both match Overview
            const isActive = location.pathname === fullPath || (item.path === '' && (location.pathname === `/projects/${projectId}/resources/${resourceId}` || location.pathname === `/projects/${projectId}/resources/${resourceId}/`));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive}
                  onClick={() => navigate(fullPath)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

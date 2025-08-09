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
  Database, 
  Settings,
  Shield
} from 'lucide-react';

const projectMenuItems = [
  {
    title: 'Resources',
    icon: Database,
    path: 'resources',
  },
  {
    title: 'Access & Permissions', 
    icon: Shield,
    path: 'access',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: 'settings',
  },
];

export default function ProjectSidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Project</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectMenuItems.map((item) => {
            const isActive = location.pathname.endsWith(item.path);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild
                  isActive={isActive}
                  onClick={() => navigate(`/project/${projectId}/${item.path}`)}
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

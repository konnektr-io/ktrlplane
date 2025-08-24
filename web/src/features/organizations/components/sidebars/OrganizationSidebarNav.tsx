import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProjectStore } from '../../../projects/store/projectStore';
import { Project } from '../../../projects/types/project.types';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Settings,
  Shield,
  Users,
  Building2,
  CreditCard,
  FolderOpen
} from 'lucide-react';

const organizationMenuItems = [
  {
    title: 'Overview',
    icon: Building2,
    path: '',
  },
  {
    title: 'Access & Permissions', 
    icon: Shield,
    path: 'access',
  },
  {
    title: 'Billing',
    icon: CreditCard,
    path: 'billing',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: 'settings',
  },
];

export default function OrganizationSidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orgId } = useParams<{ orgId: string }>();
  const { projects } = useProjectStore();
  const { state } = useSidebar();

  const isCollapsed = state === 'collapsed';

  return (
    <TooltipProvider>
      {/* Organization Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel>Organization</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {organizationMenuItems.map((item) => {
              const fullPath = `/organization/${orgId}${item.path ? `/${item.path}` : ''}`;
              const isActive = location.pathname === fullPath || (item.path === '' && (location.pathname === `/organization/${orgId}` || location.pathname === `/organization/${orgId}/`));
              const menuButton = (
                <SidebarMenuButton 
                  asChild
                  isActive={isActive}
                  onClick={() => navigate(fullPath)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </div>
                </SidebarMenuButton>
              );

              return (
                <SidebarMenuItem key={item.title}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {menuButton}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    menuButton
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Projects Section */}
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {projects.map((project: Project) => {
              const menuButton = (
                <SidebarMenuButton 
                  asChild
                  onClick={() => navigate(`/project/${project.project_id}`)}
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <FolderOpen className="h-4 w-4" />
                    {!isCollapsed && <span className="truncate">{project.name}</span>}
                  </div>
                </SidebarMenuButton>
              );

              return (
                <SidebarMenuItem key={project.project_id}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {menuButton}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="flex flex-col">
                          <p className="font-medium">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    menuButton
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </TooltipProvider>
  );
}

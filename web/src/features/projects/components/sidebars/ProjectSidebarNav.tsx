import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProjectStore } from '../../store/projectStore';
import { useOrganizationStore } from '../../../organizations/store/organizationStore';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Database, 
  Settings,
  Shield,
  FolderOpen
} from 'lucide-react';

const projectMenuItems = [
  {
    title: 'Overview',
    icon: FolderOpen,
    path: '',
  },
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
  const { currentProject, projects } = useProjectStore();
  const { currentOrganization } = useOrganizationStore();
  const { state } = useSidebar();

  const handleProjectChange = (newProjectId: string) => {
    const currentPath = location.pathname.split('/').slice(3).join('/') || '';
  navigate(`/projects/${newProjectId}/${currentPath}`);
  };

  const isCollapsed = state === 'collapsed';

  return (
    <TooltipProvider>
      {/* Project Selector */}
      <SidebarGroup>
        <SidebarGroupLabel>Project</SidebarGroupLabel>
        <SidebarGroupContent>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton className="w-full justify-center">
                  <FolderOpen className="h-4 w-4" />
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{currentProject?.name || 'Select Project'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium text-sm">
                      {currentProject?.name || 'Select Project'}
                    </span>
                    {currentOrganization && (
                      <span className="text-xs text-muted-foreground">
                        {currentOrganization.name}
                      </span>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.project_id} value={project.project_id}>
                    <div className="flex flex-col">
                      <span>{project.name}</span>
                      {project.description && (
                        <span className="text-xs text-muted-foreground">
                          {project.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Project Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {projectMenuItems.map((item) => {
              const fullPath = `/projects/${projectId}${item.path ? `/${item.path}` : ''}`;
              const isActive = location.pathname === fullPath || (item.path === '' && (location.pathname === `/projects/${projectId}` || location.pathname === `/projects/${projectId}/`));
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
    </TooltipProvider>
  );
}

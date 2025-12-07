import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjectApi';
import { useUserPermissions } from "@/features/access/hooks/useAccessApi";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Database, Shield, FolderOpen, CreditCard } from "lucide-react";

const projectMenuItems = [
  {
    title: "Overview",
    icon: FolderOpen,
    path: "",
  },
  {
    title: "Resources",
    icon: Database,
    path: "resources",
  },
  {
    title: "Access & Permissions",
    icon: Shield,
    path: "access",
  },
  {
    title: "Billing",
    icon: CreditCard,
    path: "billing",
  },
];

export default function ProjectSidebarNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects = [] } = useProjects();
  const currentProject = projects.find((p) => p.project_id === projectId) || null;
  const { state } = useSidebar();

  // Fetch permissions for current project
  const { data: permissions = [] } = useUserPermissions(
    "project",
    projectId ?? ""
  );

  const handleProjectChange = (newProjectId: string) => {
    const currentPath = location.pathname.split("/").slice(3).join("/") || "";
    navigate(`/projects/${newProjectId}/${currentPath}`);
  };

  const isCollapsed = state === "collapsed";

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
                <p>{currentProject?.name || "Select Project"}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium text-sm">
                      {currentProject?.name || "Select Project"}
                    </span>
                    {currentProject?.description && (
                      <span className="text-xs text-muted-foreground">
                        {currentProject.description}
                      </span>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem
                    key={project.project_id}
                    value={project.project_id}
                  >
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
              const fullPath = `/projects/${projectId}${
                item.path ? `/${item.path}` : ""
              }`;
              const isActive =
                location.pathname === fullPath ||
                (item.path === "" &&
                  (location.pathname === `/projects/${projectId}` ||
                    location.pathname === `/projects/${projectId}/`));

              // Only allow Billing if user has manage_billing permission
              const isBilling = item.title === "Billing";
              const canManageBilling = permissions?.includes("manage_billing");
              const isDisabled = isBilling && !canManageBilling;

              const menuButton = (
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  onClick={() => {
                    if (!isDisabled) navigate(fullPath);
                  }}
                  disabled={isDisabled}
                  style={
                    isDisabled
                      ? {
                          opacity: 0.5,
                          pointerEvents: "none",
                          cursor: "not-allowed",
                        }
                      : {}
                  }
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
                      <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                        {isDisabled && (
                          <span className="text-xs text-muted-foreground block mt-1">
                            You do not have permission to manage billing
                          </span>
                        )}
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

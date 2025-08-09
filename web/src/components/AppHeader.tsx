import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useProjectStore } from '@/store/projectStore';
import { useOrganizationStore } from '@/store/organizationStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Settings, 
  User,
  LogOut,
  ChevronDown,
  Menu,
  Building2,
  FolderOpen
} from 'lucide-react';

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth0();
  const { currentProject, projects } = useProjectStore();
  const { currentOrganization } = useOrganizationStore();

  const handleProjectChange = (newProjectId: string) => {
    const currentPath = location.pathname.split('/').slice(3).join('/') || 'resources';
    navigate(`/project/${newProjectId}/${currentPath}`);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleNavigateToProjects = () => {
    navigate('/projects');
  };

  const handleNavigateToOrgSettings = () => {
    if (currentOrganization) {
      navigate(`/organization/${currentOrganization.org_id}/settings`);
    }
  };

  const handleNavigateToProjectSettings = () => {
    if (projectId) {
      navigate(`/project/${projectId}/settings`);
    }
  };

  // If we're not in a project layout, show a simpler header
  if (!projectId) {
    return (
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">ktrlplane</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {user?.picture ? (
                    <img 
                      src={user.picture} 
                      alt="User avatar" 
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline">{user?.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue>
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium">
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
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleNavigateToProjects}>
                <FolderOpen className="mr-2 h-4 w-4" />
                All Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigateToProjectSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Project Settings
              </DropdownMenuItem>
              {currentOrganization && (
                <DropdownMenuItem onClick={handleNavigateToOrgSettings}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Organization Settings
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt="User avatar" 
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="hidden md:inline">{user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

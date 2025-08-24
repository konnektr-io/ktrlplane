import { useNavigate, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useOrganizationStore } from '../features/organizations/store/organizationStore';
import Breadcrumbs from './Breadcrumbs';
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
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth0();
  const { currentOrganization } = useOrganizationStore();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleNavigateToProjects = () => {
    navigate('/projects');
  };

  const handleNavigateToOrgSettings = () => {
    if (currentOrganization) {
      navigate(`/organizations/${currentOrganization.org_id}/settings`);
    }
  };

  const handleNavigateToProjectSettings = () => {
    if (projectId) {
      navigate(`/projects/${projectId}/settings`);
    }
  };

  // If we're not in a project layout, show a simpler header
  if (!projectId) {
    return (
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Breadcrumbs />
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
          <Breadcrumbs />
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
              {projectId && (
                <DropdownMenuItem onClick={handleNavigateToProjectSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Project Settings
                </DropdownMenuItem>
              )}
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

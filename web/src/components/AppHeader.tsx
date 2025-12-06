import { useNavigate, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useProject } from "../features/projects/hooks/useProjectApi";
import Breadcrumbs from "./Breadcrumbs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Settings,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Building2,
  FolderOpen,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import konnektrLogo from "../assets/konnektr.svg";

export default function AppHeader() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth0();
  const { data: currentProject } = useProject(projectId ?? "");

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handleNavigateToProjects = () => {
    navigate("/projects");
  };

  const handleNavigateToOrgSettings = () => {
    if (currentProject?.org_id) {
      navigate(`/organizations/${currentProject.org_id}/settings`);
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
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-6">
        <div className="flex items-center justify-between flex-1">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 mr-4">
              <img
                src={konnektrLogo}
                alt="Konnektr logo"
                className="h-6 w-6"
              />
              <span className="font-semibold hidden md:inline">Konnektr Portal</span>
            </div>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-4 mr-8">
        <SidebarTrigger className="-ml-1" />
        <img
          src={konnektrLogo}
          alt="Konnektr logo"
          className="h-6 w-6"
        />
        <span className="font-semibold hidden md:inline">Konnektr Portal</span>
      </div>
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-4">
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
              {currentProject?.org_id && (
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
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

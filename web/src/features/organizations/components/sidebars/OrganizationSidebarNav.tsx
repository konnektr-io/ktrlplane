import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    title: 'Projects',
    icon: FolderOpen,
    path: 'projects'
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
  const { state } = useSidebar();

  const isCollapsed = state === 'collapsed';

  return (
    <TooltipProvider>
      {/* Organization Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {organizationMenuItems.map((item) => {
              const fullPath = `/organizations/${orgId}${item.path ? `/${item.path}` : ''}`;
              const isActive = location.pathname === fullPath || (item.path === '' && (location.pathname === `/organizations/${orgId}` || location.pathname === `/organizations/${orgId}/`));
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

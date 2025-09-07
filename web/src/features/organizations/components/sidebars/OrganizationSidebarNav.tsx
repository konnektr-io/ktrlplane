import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUserPermissions } from '@/features/access/hooks/useUserPermissions';
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

  // Fetch permissions for current organization
  const { permissions } = useUserPermissions('organization', orgId);

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

              // Only allow Billing if user has manage_billing permission
              const isBilling = item.title === 'Billing';
              const canManageBilling = permissions?.includes('manage_billing');
              const isDisabled = isBilling && !canManageBilling;

              const menuButton = (
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  onClick={() => {
                    if (!isDisabled) navigate(fullPath);
                  }}
                  disabled={isDisabled}
                  style={isDisabled ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
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
                        {isDisabled && (
                          <span className="text-xs text-muted-foreground block mt-1">You do not have permission to manage billing</span>
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

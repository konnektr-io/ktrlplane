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
  Users,
  Building2,
  CreditCard
} from 'lucide-react';

const organizationMenuItems = [
  {
    title: 'Overview',
    icon: Building2,
    path: '',
  },
  {
    title: 'Members',
    icon: Users,
    path: 'members',
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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organization</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {organizationMenuItems.map((item) => {
            const fullPath = `/organization/${orgId}${item.path ? `/${item.path}` : ''}`;
            const isActive = location.pathname === fullPath;
            
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

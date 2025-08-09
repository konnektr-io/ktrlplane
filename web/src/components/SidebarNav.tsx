import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FolderKanban, Home } from 'lucide-react';

const navItems = [
  { href: '/projects', label: 'Projects', icon: FolderKanban },
];

export default function SidebarNav() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <Link to="/" className="flex items-center space-x-2 px-2 mb-4">
        <Home className="h-6 w-6" />
        <span className="font-semibold">ktrlplane</span>
      </Link>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-2 px-2 py-2 text-sm rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

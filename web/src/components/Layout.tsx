import { Outlet } from 'react-router-dom';
import Header from './Header'; // Placeholder Header
import SidebarNav from './SidebarNav'; // Placeholder Sidebar

export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r dark:border-neutral-800 hidden md:block">
         <SidebarNav />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet /> {/* Child routes render here */}
        </main>
      </div>
    </div>
  );
}
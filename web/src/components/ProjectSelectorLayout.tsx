import { Outlet } from 'react-router-dom';

export default function ProjectSelectorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">ktrlplane</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">dev@ktrlplane.local</span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

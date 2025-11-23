import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";

export default function MinimalAppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

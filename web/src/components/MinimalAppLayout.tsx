import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";

export default function MinimalAppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-40">
        <AppHeader />
      </div>
      <main className="container mx-auto px-6 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

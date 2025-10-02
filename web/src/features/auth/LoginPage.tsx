import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import konnektrLogo from "@/assets/konnektr.svg";

export default function LoginPage() {
  const { loginWithRedirect /* , isAuthenticated */, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      appState: {
        returnTo: "projects" + window.location.search,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  /*   if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  } */

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <div className="flex justify-center items-center gap-6 h-10 mb-12">
            <img src={konnektrLogo} alt="Konnektr" className="h-12" />
            <div className="font-bold text-3xl">Konnektr</div>
          </div>
          <h2 className="text-3xl font-bold">Welcome to ktrlplane</h2>
          <p className="mt-2 text-muted-foreground">
            Your cloud platform control plane
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your projects and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

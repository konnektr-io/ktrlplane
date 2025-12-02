import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectSecret, decodeSecretValue } from "../hooks/useProjectSecret";

interface ProjectSecretViewerProps {
  projectId: string;
  secretName: string;
  title?: string;
  description?: string;
}

export function ProjectSecretViewer({
  projectId,
  secretName,
  title = "Secret Credentials",
  description = "Securely stored credentials for this project",
}: ProjectSecretViewerProps) {
  const { data: secret, isLoading, error } = useProjectSecret(projectId, secretName);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());

  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (key: string, value: string) => {
    try {
      const decodedValue = decodeSecretValue(value);
      await navigator.clipboard.writeText(decodedValue);
      setCopiedKeys((prev) => new Set(prev).add(key));
      setTimeout(() => {
        setCopiedKeys((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load credentials. You may not have permission to access this secret.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!secret || !secret.data || Object.keys(secret.data).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No credentials found. The secret may not exist yet or is empty.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="secondary">{secret.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(secret.data).map(([key, value]) => {
          const isVisible = visibleKeys.has(key);
          const isCopied = copiedKeys.has(key);
          const decodedValue = isVisible ? decodeSecretValue(value) : "••••••••••••••••";

          return (
            <div key={key} className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{key}</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 break-all">
                  {decodedValue}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toggleVisibility(key)}
                  title={isVisible ? "Hide value" : "Show value"}
                >
                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(key, value)}
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Security Note:</strong> These credentials are sensitive. Never share them or commit them to version control.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

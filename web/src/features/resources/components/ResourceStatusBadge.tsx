import { Badge } from "@/components/ui/badge";
import React from "react";

export type ResourceStatus =
  | "Creating"
  | "Healthy"
  | "Progressing"
  | "Degraded"
  | "Suspended"
  | "Missing"
  | "Unknown"
  | "Failed"
  | "Error"
  | "Lost"
  | "Terminating"
  | string;

const statusMap: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "warning" | "info" }
> = {
  Creating: { variant: "secondary" },
  Healthy: { variant: "default" },
  Progressing: { variant: "info" },
  Degraded: { variant: "warning" },
  Suspended: { variant: "warning" },
  Missing: { variant: "warning" },
  Unknown: { variant: "warning" },
  Failed: { variant: "destructive" },
  Error: { variant: "destructive" },
  Lost: { variant: "destructive" },
  Terminating: { variant: "destructive" },
};

export const ResourceStatusBadge: React.FC<{
  status?: ResourceStatus;
  className?: string;
}> = ({ status, className }) => {
  const normalized = status ? status.trim() : "Unknown";
  const mapping = statusMap[normalized] || { variant: "default" };
  return (
    <Badge variant={mapping.variant} className={className}>
      {status || "Unknown"}
    </Badge>
  );
};

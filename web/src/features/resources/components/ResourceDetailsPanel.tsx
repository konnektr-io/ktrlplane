import type { Resource } from "../types/resource.types";


import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";

function GraphResourceDetails({ resource }: { resource: Resource }) {
  const apiUrl = `${resource.resource_id}.api.graph.konnektr.io`;
  const explorerUrl = `https://explorer.graph.konnektr.io?x-adt-url=${apiUrl}`;
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Graph Resource Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">API URL:</span>
          <a href={`https://${apiUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus-visible:outline-primary">{apiUrl}</a>
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy API URL" className="p-1">
            <Copy className={`h-4 w-4 ${copied ? 'text-primary' : 'text-muted-foreground'}`} />
          </Button>
          {copied && <span className="text-xs text-primary ml-1">Copied!</span>}
        </div>
        <div>
          <span className="font-medium">Graph Explorer:</span>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline focus-visible:outline-primary">Open Explorer</a>
        </div>
      </CardContent>
    </Card>
  );
}

function FlowResourceDetails({ resource: _resource }: { resource: Resource }) {
  // Placeholder for Flow-specific details
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Flow Resource Details</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="font-medium">Flow resource details coming soon.</span>
      </CardContent>
    </Card>
  );
}

export function ResourceDetailsPanel({ resource }: { resource: Resource }) {
  switch (resource.type) {
    case "Konnektr.Graph":
      return <GraphResourceDetails resource={resource} />;
    case "Konnektr.Flow":
      return <FlowResourceDetails resource={resource} />;
    default:
      return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">No additional details for this resource type.</div>
          </CardContent>
        </Card>
      );
  }
}

export default ResourceDetailsPanel;

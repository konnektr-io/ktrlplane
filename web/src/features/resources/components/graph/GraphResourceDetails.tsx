import type { Resource } from "../../types/resource.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, BookOpen } from "lucide-react";
import { useState } from "react";

const DOCS_URL = "https://docs.konnektr.io/graph";

export default function GraphResourceDetails({
  resource,
}: {
  resource: Resource;
}) {
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
      {/* <CardHeader>
        <CardTitle>Graph Resource Details</CardTitle>
      </CardHeader> */}
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 h-6">
          <span className="font-medium">API URL:</span>
          <a
            href={`https://${apiUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline focus-visible:outline-primary"
          >
            {apiUrl}
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            title="Copy API URL"
            className="p-1"
          >
            <Copy
              className={`h-4 w-4 ${
                copied ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </Button>
          {copied && <span className="text-xs text-primary ml-1">Copied!</span>}
        </div>
        <div className="h-6">
          <span className="font-medium">Graph Explorer:</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-primary hover:underline focus-visible:outline-primary"
          >
            Open Explorer
          </a>
        </div>
        <div className="flex items-center h-6">
          <BookOpen className="h-4 w-4 mr-1 inline" />
          <a
            href="https://docs.konnektr.io/docs/graph"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-primary hover:underline focus-visible:outline-primary"
          >
            Documentation
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

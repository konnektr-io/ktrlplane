import type { Resource } from "../../types/resource.types";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function FlowResourceDetails({
  resource,
}: {
  resource: Resource;
}) {
  const flowEditorUrl = `https://flow.konnektr.io/${resource.resource_id}`;
  return (
    <Card className="mb-4">
      {/* <CardHeader>
        <CardTitle>Flow Resource Details</CardTitle>
      </CardHeader> */}
      <CardContent>
        <span className="font-medium">Flow resource details coming soon.</span>
        <div className="h-6">
          <span className="font-medium">Flow Editor:</span>
          <a
            href={flowEditorUrl}
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
            href="https://docs.konnektr.io/docs/flow"
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

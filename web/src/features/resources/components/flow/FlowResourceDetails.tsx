import type { Resource } from "../../types/resource.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const DOCS_URL = "https://docs.konnektr.io/flow";

export default function FlowResourceDetails({
  resource,
}: {
  resource: Resource;
}) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Flow Resource Details</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="font-medium">Flow resource details coming soon.</span>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="link"
            size="sm"
            asChild
            className="p-0 h-auto text-blue-700"
          >
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              <BookOpen className="h-4 w-4 mr-1 inline" />
              Documentation
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

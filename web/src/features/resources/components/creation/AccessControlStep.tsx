import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface AccessControlStepProps {
  resourceName: string;
  onSkip: () => void;
  onConfigure: () => void;
}

export function AccessControlStep({
  resourceName,
  onSkip,
  onConfigure,
}: AccessControlStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant Access (Optional)</CardTitle>
          <CardDescription>
            Add team members or collaborators to {resourceName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                You can grant access to this resource now or skip this step and
                add collaborators later from the resource's Access tab.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Access control allows you to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Invite team members to collaborate</li>
              <li>Assign specific roles and permissions</li>
              <li>Control who can view, edit, or manage the resource</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip for Now
            </Button>
            <Button onClick={onConfigure} className="flex-1">
              Configure Access
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You can always manage access control later in the resource settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

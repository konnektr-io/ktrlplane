import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResourceType } from "../../catalog/resourceTypes";

type ResourceTypeEnum = ResourceType['id']; 

interface ResourceTypeStepProps {
  resourceTypes: ResourceType[];
  selectedType: ResourceTypeEnum | "";
  onTypeSelect: (type: ResourceTypeEnum) => void;
}

export function ResourceTypeStep({
  resourceTypes,
  selectedType,
  onTypeSelect,
}: ResourceTypeStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Resource Type</CardTitle>
          <CardDescription>
            Choose the type of resource you want to create for your project
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {resourceTypes.map((resourceType) => {
              const IconComponent = resourceType.icon;
              const isSelected = selectedType === resourceType.id;
              const isDisabled = resourceType.disable;

              return (
                <div
                  key={resourceType.id}
                  className={`relative rounded-lg border-2 p-4 transition-colors ${
                    isDisabled
                      ? "border-muted bg-muted cursor-not-allowed opacity-60"
                      : isSelected
                      ? "border-primary bg-primary/5 cursor-pointer hover:border-primary/50"
                      : "border-muted cursor-pointer hover:border-primary/50"
                  }`}
                  onClick={() => {
                    if (isDisabled) return;
                    onTypeSelect(resourceType.id as ResourceTypeEnum);
                  }}
                  aria-disabled={isDisabled}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-6 w-6 text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {resourceType.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {resourceType.description}
                      </p>
                      {isDisabled && (
                        <span className="text-xs text-muted-foreground mt-2 block">
                          Coming soon
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

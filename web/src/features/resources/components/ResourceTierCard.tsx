import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useResourcePricing } from "../hooks/useResourcePricing";
import type { ResourceTier } from "../catalog/resourceTypes";

interface ResourceTierCardProps {
  tier: ResourceTier & { features?: string[]; limits?: Record<string, string> };
  resourceTypeId: string;
  selected: boolean;
  onSelect: () => void;
}

export function ResourceTierCard({ tier, resourceTypeId, selected, onSelect }: ResourceTierCardProps) {
  const { data: priceData, isLoading: priceLoading } = useResourcePricing(resourceTypeId, tier.sku);
  return (
    <Card
      key={tier.sku}
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected ? "ring-2 ring-primary shadow-md scale-[1.02]" : "hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            <input
              type="radio"
              name="resourceTier"
              value={tier.sku}
              checked={selected}
              onChange={onSelect}
              className="h-4 w-4"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xl text-foreground">{tier.name}</h4>
              <div className="text-right">
                {priceLoading ? (
                  <span className="text-xs text-muted-foreground">Loading...</span>
                ) : priceData ? (
                  <>
                    <span className="text-2xl font-bold text-primary">
                      {priceData.amount === 0
                        ? "Free"
                        : `${(priceData.amount / 100).toLocaleString(undefined, { style: 'currency', currency: priceData.currency.toUpperCase() })}`}
                    </span>
                    {priceData.amount > 0 && (
                      <p className="text-xs text-muted-foreground">per {priceData.interval}</p>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">N/A</span>
                )}
              </div>
            </div>
            {tier.features && (
              <ul className="space-y-2 mb-4">
                {tier.features.map((feature, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            {tier.limits && Object.entries(tier.limits).length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium mb-2">Resource Limits:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(tier.limits).map(([key, value]) => (
                    <div key={key} className="text-xs text-muted-foreground">
                      <span className="font-medium">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

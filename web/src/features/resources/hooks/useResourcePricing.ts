import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface ResourceTierPrice {
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
  sku: string;
  resource_type: string;
}

export function useResourcePricing(resourceType: string, sku: string) {
  return useQuery<ResourceTierPrice | null>({
    queryKey: ["resource-pricing", resourceType, sku],
    queryFn: async () => {
      if (!resourceType || !sku) return null;
      const response = await apiClient.get("/resource-pricing", {
        params: { type: resourceType, sku },
      });
      return response.data;
    },
    enabled: !!resourceType && !!sku,
  });
}

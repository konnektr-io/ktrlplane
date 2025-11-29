// Utility to determine if a resource type/tier requires billing (paid)
// This should be kept in sync with backend billing enforcement logic

// Only 'free' SKU is free, all others are paid (matches backend logic)
export function isPaidResource(_resourceType: string, sku: string): boolean {
  return sku !== "free";
}

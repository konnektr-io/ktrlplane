// Utility functions for generating and validating DNS-compliant IDs

/**
 * Slugifies a name into a DNS-compliant format
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes non-alphanumeric characters except hyphens
 * - Removes consecutive hyphens
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')           // Replace spaces and underscores with hyphens
    .replace(/[^a-z0-9-]/g, '')        // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-')               // Replace consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, '');          // Remove leading/trailing hyphens
}

/**
 * Generates a random suffix for uniqueness
 */
export function generateRandomSuffix(length: number = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generates a DNS-compliant ID from a display name
 */
export function generateDNSId(name: string): string {
  const slug = slugify(name);
  const suffix = generateRandomSuffix(4);
  
  // Ensure it starts with a letter
  const base = slug.length > 0 && /^[a-z]/.test(slug) ? slug : `r${slug}`;
  
  return `${base}-${suffix}`;
}

/**
 * Validates that an ID meets DNS requirements
 */
export function validateDNSId(id: string): string | null {
  if (!id) {
    return 'ID is required';
  }

  if (id.length > 63) {
    return 'ID cannot be longer than 63 characters';
  }

  if (!/^[a-z]/.test(id)) {
    return 'ID must start with a lowercase letter';
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    return 'ID can only contain lowercase letters, numbers, and hyphens';
  }

  if (id.endsWith('-')) {
    return 'ID cannot end with a hyphen';
  }

  if (id.includes('--')) {
    return 'ID cannot contain consecutive hyphens';
  }

  return null; // Valid
}

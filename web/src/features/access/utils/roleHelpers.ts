import { Role } from "../types/access.types";

/**
 * Sorts roles in a logical order:
 * 1. Universal control plane roles (Owner, Editor, Viewer)
 * 2. Data Owner role (cross-resource data plane access)
 * 3. Resource-specific roles (Graph, Flow, Assembler, etc.)
 *
 * Within each category, roles are sorted by their natural hierarchy (Owner > Editor > Viewer)
 */
export function sortRoles(roles: Role[]): Role[] {
  return [...roles].sort((a, b) => {
    // Helper to determine role category
    const getCategory = (role: Role): number => {
      if (
        role.name === "Owner" ||
        role.name === "Editor" ||
        role.name === "Viewer"
      ) {
        return 1; // Universal control plane roles
      }
      if (role.name === "Konnektr.Data.Owner") {
        return 2; // Data Owner (cross-resource)
      }
      return 3; // Resource-specific roles (Graph, Flow, etc.)
    };

    // Helper to get hierarchy within category
    const getHierarchy = (role: Role): number => {
      if (role.name.includes("Owner")) return 1;
      if (role.name.includes("Editor")) return 2;
      if (role.name.includes("Viewer")) return 3;
      return 4;
    };

    const categoryA = getCategory(a);
    const categoryB = getCategory(b);

    // First sort by category
    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    // Within same category, sort by hierarchy
    const hierarchyA = getHierarchy(a);
    const hierarchyB = getHierarchy(b);

    if (hierarchyA !== hierarchyB) {
      return hierarchyA - hierarchyB;
    }

    // If same hierarchy, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gets a category label for grouping roles in the UI
 */
export function getRoleCategory(role: Role): string {
  if (
    role.name === "Owner" ||
    role.name === "Editor" ||
    role.name === "Viewer"
  ) {
    return "Platform Access";
  }
  if (role.name === "Konnektr.Data.Owner") {
    return "Data Access";
  }
  return "Resource-Specific Access";
}

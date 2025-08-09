import { z } from "zod";

// Basic validation for helm values being parsable JSON
const jsonString = z.string().refine((val) => {
    try {
        JSON.parse(val);
        return true;
    } catch {
        return false;
    }
}, { message: "Helm values must be valid JSON" }).optional().default("{}");

export const projectSchema = z.object({
    project_id: z.string(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    status: z.string(),
    created_at: z.string().datetime().or(z.date()).transform(val => new Date(val)), // Handle string or date
    updated_at: z.string().datetime().or(z.date()).transform(val => new Date(val)),
});

export const resourceSchema = z.object({
    resource_id: z.string(),
    project_id: z.string(), // Included from backend response context
    name: z.string().min(1, "Name is required"),
    type: z.string(), // e.g., "GraphDatabase", "Flow"
    status: z.string(),
    helm_values: z.any().transform(val => { // Expect raw JSON, parse for display/edit
        try {
             if (typeof val === 'string') return JSON.parse(val || '{}');
             if (typeof val === 'object') return val ?? {}; // Already an object
             return {};
        } catch {
            return {}; // Default empty object if parsing fails
        }
    }),
    created_at: z.string().datetime().or(z.date()).transform(val => new Date(val)),
    updated_at: z.string().datetime().or(z.date()).transform(val => new Date(val)),
    error_message: z.string().optional(),
    access_url: z.string().optional(),
});


// --- Form Schemas ---

export const createProjectSchema = z.object({
    name: z.string().min(3, "Project name must be at least 3 characters"),
    description: z.string().optional(),
});

export const updateProjectSchema = createProjectSchema.partial(); // All fields optional for update

export const createResourceSchema = z.object({
    name: z.string().min(3, "Resource name must be at least 3 characters"),
    type: z.enum(["GraphDatabase", "Flow"]), // Add other types as needed
    // Use a textarea for JSON initially, consider specific fields later
    helm_values: jsonString,
});

export const updateResourceSchema = z.object({
    name: z.string().min(3, "Resource name must be at least 3 characters").optional(),
    // Use a textarea for JSON initially
    helm_values: jsonString,
});
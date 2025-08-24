import { z } from "zod";

export const resourceSchemas = {
  GraphDatabase: z.object({
    instances: z.number().int().min(1).max(6),
  }),
  Flow: z.object({}), // No settings for Flow
};

export type ResourceType = keyof typeof resourceSchemas;

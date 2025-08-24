import { z } from "zod";

export const GraphDatabaseSchema = z.object({
  instances: z.number().int().min(1).max(6),
});

export type GraphDatabaseSettings = z.infer<typeof GraphDatabaseSchema>;

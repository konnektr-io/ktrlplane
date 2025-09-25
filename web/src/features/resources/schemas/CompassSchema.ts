import { z } from "zod";

export const CompassSchema = z.object({
  dashboardName: z.string().min(1, "Dashboard name is required"),
  simulationEnabled: z.boolean().default(false),
  analyticsLevel: z.enum(["basic", "advanced"]).default("basic"),
});

export type CompassSettings = z.infer<typeof CompassSchema>;

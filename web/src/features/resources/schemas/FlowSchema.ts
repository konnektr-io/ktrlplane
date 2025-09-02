import { z } from "zod";

export const FlowSchema = z.object({
  replicas: z.number().int().min(1).max(10).default(1),
  environment: z.array(z.object({
    name: z.string().min(1, 'Environment variable name is required'),
    value: z.string(),
  })).default([]),
  autoscaling: z.object({
    enabled: z.boolean().default(false),
    minReplicas: z.number().int().min(1).default(1),
    maxReplicas: z.number().int().min(1).max(20).default(5),
    targetCPU: z.number().int().min(1).max(100).default(70),
  }).default({}),
});

export type FlowSettings = z.infer<typeof FlowSchema>;

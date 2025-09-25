import { z } from "zod";

export const AssemblerSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  dataSource: z.string().min(1, "Data source is required"),
  aiConfig: z
    .object({
      enabled: z.boolean().default(true),
      provider: z.string().min(1).default("OpenAI"),
      temperature: z.number().min(0).max(2).default(0.7),
    })
    .default({}),
});

export type AssemblerSettings = z.infer<typeof AssemblerSchema>;

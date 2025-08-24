import { z } from "zod";

export const FlowSchema = z.object({});
export type FlowSettings = z.infer<typeof FlowSchema>;

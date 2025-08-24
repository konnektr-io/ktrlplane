import { GraphDatabaseSchema } from "./GraphDatabaseSchema";
import { FlowSchema } from "./FlowSchema";

export const resourceSchemas = {
  GraphDatabase: GraphDatabaseSchema,
  Flow: FlowSchema,
};

export type ResourceType = keyof typeof resourceSchemas;

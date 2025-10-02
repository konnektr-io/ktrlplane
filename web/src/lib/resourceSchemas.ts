// Re-export schemas from the features module
export { resourceSchemas, defaultConfigurations, type ResourceType } from '@/features/resources/schemas';
export {
  DigitalTwinsSchema,
  type GraphSettings as DigitalTwinsSettings,
  type SinkConfig,
  type EventRouteConfig,
} from "@/features/resources/schemas/GraphSchema";
export { FlowSchema, type FlowSettings } from '@/features/resources/schemas/FlowSchema';

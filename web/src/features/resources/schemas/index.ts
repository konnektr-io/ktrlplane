import { DigitalTwinsSchema } from "./DigitalTwinsSchema";
import { FlowSchema } from "./FlowSchema";

export const resourceSchemas = {
  'Konnektr.DigitalTwins': DigitalTwinsSchema,
  'Konnektr.Flows': FlowSchema,
};

export type ResourceType = keyof typeof resourceSchemas;

// Default configurations
export const defaultConfigurations = {
  'Konnektr.DigitalTwins': {
    instances: 1,
    sinks: [],
    eventRoutes: [],
    persistence: {
      enabled: true,
      storageSize: '10Gi',
    },
  },
  'Konnektr.Flows': {
    replicas: 1,
    environment: [],
    autoscaling: {
      enabled: false,
      minReplicas: 1,
      maxReplicas: 5,
      targetCPU: 70,
    },
  },
};

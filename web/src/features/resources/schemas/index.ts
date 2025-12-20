import { GraphSchema } from "./GraphSchema";
import { FlowSchema } from "./FlowSchema";
import { AssemblerSchema } from "./AssemblerSchema";
import { CompassSchema } from "./CompassSchema";

// DEPRECATED
// USE catalog/resourceTypes

/* @deprecated */
export const resourceSchemas = {
  "Konnektr.Graph": GraphSchema,
  "Konnektr.Flow": FlowSchema,
  "Konnektr.Assembler": AssemblerSchema,
  "Konnektr.Compass": CompassSchema,
};

/* @deprecated */
export type ResourceType = keyof typeof resourceSchemas;

// Default configurations
/* @deprecated */
export const defaultConfigurations = {
  "Konnektr.Graph": {
    eventSinks: {
      kafka: [],
      kusto: [],
    },
    eventRoutes: [],
  },
  "Konnektr.Flow": {},
  "Konnektr.Assembler": {
    modelName: "",
    dataSource: "",
    aiConfig: {
      enabled: true,
      provider: "OpenAI",
      temperature: 0.7,
    },
  },
  "Konnektr.Compass": {
    dashboardName: "",
    simulationEnabled: false,
    analyticsLevel: "basic",
  },
};

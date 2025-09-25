import { DigitalTwinsSchema } from "./GraphSchema";
import { FlowSchema } from "./FlowSchema";
import { AssemblerSchema } from "./AssemblerSchema";
import { CompassSchema } from "./CompassSchema";

export const resourceSchemas = {
  "Konnektr.Graph": DigitalTwinsSchema,
  "Konnektr.Flow": FlowSchema,
  "Konnektr.Assembler": AssemblerSchema,
  "Konnektr.Compass": CompassSchema,
};

export type ResourceType = keyof typeof resourceSchemas;

// Default configurations
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

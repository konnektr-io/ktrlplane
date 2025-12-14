import { Database, Workflow, Key } from "lucide-react";

export interface ResourceTier {
  sku: string;
  name: string;
  // price: string;
  features: string[];
  limits: Record<string, string>;
}

export interface ResourceType {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<Record<string, unknown>>; // Accepts any props, required for React components
  category: string;
  features: string[];
  skus: ResourceTier[];
  documentationUrl: string;
  isPopular?: boolean;
  isNew?: boolean;
  disable?: boolean;
  hasSettings?: boolean; // Does this resource type have configuration settings?
  settingsReady?: boolean; // Are the settings UI/schema ready for production?
  requiresSettings?: boolean; // Are settings mandatory before creation?
}

export const resourceTypes: ResourceType[] = [
  {
    id: "Konnektr.Graph",
    name: "Graph",
    description:
      "High-performance graph database and API layer for digital twin data and event processing.",
    longDescription:
      "A scalable, event-driven graph database for digital twin modeling, analytics, and event processing.",
    icon: Database,
    category: "Database",
    features: ["Graph storage", "Event processing", "Scalable", "API access"],
    skus: [
      {
        sku: "standard",
        name: "Standard",
        features: ["Events", "M2M Authentication", "Email support"],
        limits: { Twins: "1M" },
      },
      {
        sku: "free",
        name: "Free",
        // price: "$0/mo",
        features: [
          "Development Only",
          "User Authentication",
          "Up to 500 twins",
          "Rate Limits",
        ],
        limits: { Twins: "500", "Rate Limit": "1,000 QU/min" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/graph",
    isPopular: true,
    hasSettings: true,
    settingsReady: false, // Graph settings not ready for production yet
    requiresSettings: false,
  },
  {
    id: "Konnektr.Flow",
    name: "Flow",
    description:
      "Real-time data and event processing engine for digital twins and automation.",
    longDescription:
      "A workflow engine for orchestrating business processes, automation, and integrations.",
    icon: Workflow,
    category: "Workflow",
    features: ["Workflow orchestration", "Scaling", "Environment variables"],
    skus: [
      {
        sku: "standard",
        name: "Standard",
        // price: "$29/mo",
        features: ["Up to 50 flows", "Email support"],
        limits: { Flows: "50", Executions: "10,000/mo" },
      },
      {
        sku: "free",
        name: "Free",
        // price: "$0/mo",
        features: ["Up to 5 flows", "Community support"],
        limits: { Flows: "5", Executions: "1,000/mo" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/flow",
    isNew: true,
    disable: true,
    hasSettings: true,
    settingsReady: false, // Flow settings not ready yet
    requiresSettings: false,
  },
  {
    id: "Konnektr.Assembler",
    name: "Assembler",
    description:
      "AI-powered digital twin builder for automated model generation.",
    longDescription:
      "Automate the creation of DTDL models and graph relationships from any data source with an intuitive, low-code visual interface.",
    icon: Database,
    category: "AI Builder",
    features: ["AI model generation", "Low-code interface", "DTDL support"],
    skus: [
      {
        sku: "standard",
        name: "Standard",
        // price: "$49/mo",
        features: ["Up to 20 models", "Email support"],
        limits: { Models: "20", DataSources: "5" },
      },
      {
        sku: "free",
        name: "Free",
        // price: "$0/mo",
        features: ["Up to 3 models", "Community support"],
        limits: { Models: "3", DataSources: "1" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/assembler",
    isNew: true,
    disable: true,
    hasSettings: true,
    settingsReady: false, // Assembler settings not ready yet
    requiresSettings: false,
  },
  {
    id: "Konnektr.Compass",
    name: "Compass",
    description:
      "Navigation and discovery tool for digital twin analytics and simulation.",
    longDescription:
      "Analytics, visualization, and simulation layer for digital twin environments.",
    icon: Database,
    category: "Analytics",
    features: ["Dashboarding", "Simulation", "Cross-twin analytics"],
    skus: [
      {
        sku: "free",
        name: "Free",
        // price: "$0/mo",
        features: ["Basic analytics", "Community support"],
        limits: { Dashboards: "1", Simulations: "1" },
      },
      {
        sku: "standard",
        name: "Standard",
        // price: "$99/mo",
        features: ["Advanced analytics", "Simulation engine", "Email support"],
        limits: { Dashboards: "10", Simulations: "10" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/compass",
    isNew: true,
    disable: true,
    hasSettings: true,
    settingsReady: false, // Compass settings not ready yet
    requiresSettings: false,
  },
  {
    id: "Konnektr.Secret",
    name: "Secret",
    description: "Securely store sensitive information like passwords, tokens, and keys.",
    longDescription:
      "Kubernetes-backed secret storage for managing sensitive configuration data used by other resources.",
    icon: Key,
    category: "Security",
    features: ["Secure storage", "RBAC controlled", "Kubernetes Native"],
    skus: [
      {
        sku: "standard",
        name: "Standard",
        features: ["Secure Encryption"],
        limits: {},
      },
    ],
    documentationUrl: "https://docs.konnektr.io/secrets",
    isNew: true,
    hasSettings: false,
    settingsReady: false,
    requiresSettings: false,
  },
];

import { Database, Workflow } from "lucide-react";

export interface ResourceTier {
  sku: string;
  name: string;
  price: string;
  features: string[];
  limits: Record<string, string>;
}

export interface ResourceType {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  icon: any;
  category: string;
  features: string[];
  skus: ResourceTier[];
  documentationUrl: string;
  isPopular?: boolean;
  isNew?: boolean;
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
        sku: "free",
        name: "Free",
        price: "$0/mo",
        features: ["Up to 1,000 twins", "Community support"],
        limits: { Twins: "1,000", Storage: "1GB" },
      },
      {
        sku: "standard",
        name: "Standard",
        price: "$29/mo",
        features: ["Up to 10,000 twins", "Email support"],
        limits: { Twins: "10,000", Storage: "10GB" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/graph",
    isPopular: true,
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
        sku: "free",
        name: "Free",
        price: "$0/mo",
        features: ["Up to 5 flows", "Community support"],
        limits: { Flows: "5", Executions: "1,000/mo" },
      },
      {
        sku: "standard",
        name: "Standard",
        price: "$29/mo",
        features: ["Up to 50 flows", "Email support"],
        limits: { Flows: "50", Executions: "10,000/mo" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/flow",
    isNew: true,
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
        sku: "free",
        name: "Free",
        price: "$0/mo",
        features: ["Up to 3 models", "Community support"],
        limits: { Models: "3", DataSources: "1" },
      },
      {
        sku: "standard",
        name: "Standard",
        price: "$49/mo",
        features: ["Up to 20 models", "Email support"],
        limits: { Models: "20", DataSources: "5" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/assembler",
    isNew: true,
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
        price: "$0/mo",
        features: ["Basic analytics", "Community support"],
        limits: { Dashboards: "1", Simulations: "1" },
      },
      {
        sku: "standard",
        name: "Standard",
        price: "$99/mo",
        features: ["Advanced analytics", "Simulation engine", "Email support"],
        limits: { Dashboards: "10", Simulations: "10" },
      },
    ],
    documentationUrl: "https://docs.konnektr.io/compass",
    isNew: true,
  },
];

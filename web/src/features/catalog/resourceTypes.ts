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
    id: "Konnektr.DigitalTwins",
    name: "Digital Twins",
    description:
      "Age Graph Database for storing and querying digital twin data with event processing",
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
    documentationUrl: "https://docs.konnektr.io/digital-twins",
    isPopular: true,
  },
  {
    id: "Konnektr.Flows",
    name: "Flows",
    description:
      "Process flows and workflows with configurable scaling and environment variables",
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
    documentationUrl: "https://docs.konnektr.io/flows",
    isNew: true,
  },
];

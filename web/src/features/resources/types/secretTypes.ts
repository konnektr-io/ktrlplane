// Secret Types define which keys are required/optional for each secret type
export interface SecretType {
  id: string;
  name: string;
  description: string;
  keys: {
    name: string;
    label: string;
    placeholder?: string;
    required: boolean;
    isPassword?: boolean;
  }[];
}

export const secretTypes: SecretType[] = [
  {
    id: "generic",
    name: "Generic",
    description: "Custom key-value pairs for any purpose",
    keys: [], // Dynamic - user adds their own
  },
  {
    id: "oauth-client",
    name: "OAuth Client Credentials",
    description: "For OAuth 2.0 client credentials flow (Azure AD, etc.)",
    keys: [
      { name: "tenantId", label: "Tenant ID", placeholder: "Azure Tenant ID", required: true },
      { name: "clientId", label: "Client ID", placeholder: "Application (client) ID", required: true },
      { name: "clientSecret", label: "Client Secret", placeholder: "Client secret value", required: true, isPassword: true },
      { name: "tokenEndpoint", label: "Token Endpoint", placeholder: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token", required: false },
    ],
  },
  {
    id: "basic-auth",
    name: "Basic Authentication",
    description: "Username and password for Basic Auth",
    keys: [
      { name: "username", label: "Username", placeholder: "Username", required: true },
      { name: "password", label: "Password", placeholder: "Password", required: true, isPassword: true },
    ],
  },
  {
    id: "bearer-token",
    name: "Bearer Token",
    description: "Single bearer token for API authentication",
    keys: [
      { name: "token", label: "Bearer Token", placeholder: "Your bearer token", required: true, isPassword: true },
    ],
  },
  {
    id: "api-key",
    name: "API Key",
    description: "API key with custom header name",
    keys: [
      { name: "headerName", label: "Header Name", placeholder: "e.g., X-API-Key", required: true },
      { name: "headerValue", label: "Header Value", placeholder: "Your API key", required: true, isPassword: true },
    ],
  },
  {
    id: "kafka-plain",
    name: "Kafka SASL PLAIN",
    description: "Username and password for Kafka SASL PLAIN authentication",
    keys: [
      { name: "username", label: "SASL Username", placeholder: "Kafka username", required: true },
      { name: "password", label: "SASL Password", placeholder: "Kafka password", required: true, isPassword: true },
    ],
  },
  {
    id: "mqtt-credentials",
    name: "MQTT Credentials",
    description: "Username and password for MQTT broker authentication",
    keys: [
      { name: "username", label: "Username", placeholder: "MQTT username", required: true },
      { name: "password", label: "Password", placeholder: "MQTT password", required: true, isPassword: true },
    ],
  },
];

export function getSecretType(id: string): SecretType | undefined {
  return secretTypes.find((t) => t.id === id);
}

export function getSecretTypeKeys(typeId: string): string[] {
  const type = getSecretType(typeId);
  return type?.keys.map((k) => k.name) || [];
}

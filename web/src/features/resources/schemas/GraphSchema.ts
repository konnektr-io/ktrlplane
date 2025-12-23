// Kafka Sink Configuration
export interface KafkaSink {
  id?: string;
  name: string;
  brokerList: string;
  topic: string;
  saslMechanism: "PLAIN" | "OAUTHBEARER";
  securityProtocol: "PLAINTEXT" | "SASL_PLAINTEXT" | "SASL_SSL";
  
  // Secret references (required for authentication)
  // Format: {secretName}/{keyName}
  tenantIdRef?: string;      // e.g., "kafka-oauth/tenantId"
  clientIdRef?: string;       // e.g., "kafka-oauth/clientId"
  clientSecretRef?: string;   // e.g., "kafka-oauth/clientSecret"
  tokenEndpointRef?: string;  // e.g., "kafka-oauth/tokenEndpoint"
  saslUsernameRef?: string;   // e.g., "kafka-plain/username"
  saslPasswordRef?: string;   // e.g., "kafka-plain/password"
}

// Kusto Sink Configuration
export interface KustoSink {
  id?: string;
  name: string;
  ingestionUri: string;
  database: string;
  propertyEventsTable?: string;
  twinLifeCycleEventsTable?: string;
  relationshipLifeCycleEventsTable?: string;
  
  // Secret references (required for Azure AD auth)
  // Format: {secretName}/{keyName}
  tenantIdRef?: string;     // e.g., "kusto-auth/tenantId"
  clientIdRef?: string;      // e.g., "kusto-auth/clientId"
  clientSecretRef?: string;  // e.g., "kusto-auth/clientSecret"
}

// MQTT Sink Configuration
export interface MqttSink {
  id?: string;
  name: string;
  broker: string;
  port: number;
  topic: string;
  clientId: string;
  protocolVersion: "3.1.0" | "3.1.1" | "5.0.0";
  
  // Secret references (for authentication)
  // Format: {secretName}/{keyName}
  usernameRef?: string;       // e.g., "mqtt-creds/username"
  passwordRef?: string;        // e.g., "mqtt-creds/password"
  tokenEndpointRef?: string;   // e.g., "mqtt-oauth/tokenEndpoint"
  tenantIdRef?: string;        // e.g., "mqtt-oauth/tenantId"
  clientSecretRef?: string;    // e.g., "mqtt-oauth/clientSecret"
}

// Webhook Sink Configuration
export interface WebhookSink {
  id?: string;
  name: string;
  url: string;
  method: "POST" | "PUT";
  authenticationType: "None" | "Basic" | "Bearer" | "ApiKey" | "OAuth";
  
  // Secret references (for authentication)
  // Format: {secretName}/{keyName}
  usernameRef?: string;       // e.g., "webhook-auth/username" (Basic)
  passwordRef?: string;        // e.g., "webhook-auth/password" (Basic)
  tokenRef?: string;           // e.g., "webhook-auth/token" (Bearer)
  headerNameRef?: string;      // e.g., "webhook-auth/headerName" (ApiKey)
  headerValueRef?: string;     // e.g., "webhook-auth/headerValue" (ApiKey)
  tokenEndpointRef?: string;   // e.g., "webhook-auth/tokenEndpoint" (OAuth)
  clientIdRef?: string;        // e.g., "webhook-auth/clientId" (OAuth)
  clientSecretRef?: string;    // e.g., "webhook-auth/clientSecret" (OAuth)
}

// Event Route Configuration
export interface EventRoute {
  id?: string;
  sinkName: string;
  eventFormat: "EventNotification" | "DataHistory" | "Telemetry";
  typeMappings?: Record<string, string>; // Map of SinkEventType to table/topic names
}

// Main Graph Settings
export interface GraphSettings {
  eventSinks: {
    kafka: KafkaSink[];
    kusto: KustoSink[];
    mqtt: MqttSink[];
    webhook: WebhookSink[];
  };
  eventRoutes: EventRoute[];
}
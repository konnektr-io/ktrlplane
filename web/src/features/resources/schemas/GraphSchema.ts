import { SecretRef } from "../types/secretTypes";

// Kafka Sink Configuration
export interface KafkaSink {
  id?: string;
  name: string;
  brokerList: string;
  topic: string;
  saslMechanism: "PLAIN" | "OAUTHBEARER";
  securityProtocol: "PLAINTEXT" | "SASL_PLAINTEXT" | "SASL_SSL";
  tenantId?: SecretRef;
  clientId?: SecretRef;
  clientSecret?: SecretRef;
  tokenEndpoint?: SecretRef;
  saslUsername?: SecretRef;
  saslPassword?: SecretRef;
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
  tenantId?: SecretRef;
  clientId?: SecretRef;
  clientSecret?: SecretRef;
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
  username?: SecretRef;
  password?: SecretRef;
  tokenEndpoint?: SecretRef;
  tenantId?: SecretRef;
  clientSecret?: SecretRef;
}

// Webhook Sink Configuration
export interface WebhookSink {
  name: string;
  url: string;
  method: "POST" | "PUT";
  authenticationType: "None" | "Basic" | "Bearer" | "ApiKey" | "OAuth";
  username?: SecretRef;
  password?: SecretRef;
  token?: SecretRef;
  headerName?: SecretRef;
  headerValue?: SecretRef;
  tokenEndpoint?: SecretRef;
  clientId?: SecretRef;
  clientSecret?: SecretRef;
}

// Event Route Configuration
export interface EventRoute {
  name: string;
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

import { z } from "zod";

// Kafka sink (federated credentials, OAUTHBEARER only)
const kafkaSinkConfig = z.object({
  name: z.string().min(1),
  brokerList: z.string().min(1),
  topic: z.string().min(1),
  saslMechanism: z.literal('OAUTHBEARER'),
});

// Kusto sink (federated credentials)
const kustoSinkConfig = z.object({
  name: z.string().min(1),
  ingestionUri: z.string().url(),
  database: z.string().min(1),
});

export const eventSinksSchema = z.object({
  kafka: z.array(kafkaSinkConfig).default([]),
  kusto: z.array(kustoSinkConfig).default([]),
});

export const eventRouteSchema = z.object({
  sinkName: z.string().min(1, 'Sink selection is required'),
  eventFormat: z.enum(['EventNotification', 'DataHistory']),
});

export const GraphSchema = z.object({
  eventSinks: eventSinksSchema,
  eventRoutes: z.array(eventRouteSchema).default([]),
});

export type GraphSettings = z.infer<typeof GraphSchema>;
export type EventSinksConfig = z.infer<typeof eventSinksSchema>;
export type EventRouteConfig = z.infer<typeof eventRouteSchema>;
export type KafkaSinkConfig = z.infer<typeof kafkaSinkConfig>;
export type KustoSinkConfig = z.infer<typeof kustoSinkConfig>;
export type SinkConfig = KafkaSinkConfig | KustoSinkConfig;

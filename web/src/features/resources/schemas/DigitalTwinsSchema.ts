import { z } from "zod";

// Authentication schemas
const kafkaSecurityProtocolSchema = z.enum(['PLAINTEXT', 'SSL', 'SASL_PLAINTEXT', 'SASL_SSL']);

const kafkaSaslMechanismSchema = z.enum(['PLAIN', 'SCRAM-SHA-256', 'SCRAM-SHA-512']);

const kafkaAuthSchema = z.object({
  securityProtocol: kafkaSecurityProtocolSchema,
  saslMechanism: kafkaSaslMechanismSchema.optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

const webhookAuthSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  z.object({ 
    type: z.literal('basic'),
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  z.object({ 
    type: z.literal('bearer'),
    token: z.string().min(1),
  }),
  z.object({ 
    type: z.literal('api_key'),
    header: z.string().min(1),
    value: z.string().min(1),
  }),
]);

const databaseAuthSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  sslMode: z.enum(['disable', 'require', 'verify-ca', 'verify-full']).default('require'),
});

// Sink schemas
const kafkaSinkSchema = z.object({
  type: z.literal('kafka'),
  bootstrapServers: z.string().min(1),
  topic: z.string().min(1),
  auth: kafkaAuthSchema.optional(),
});

const webhookSinkSchema = z.object({
  type: z.literal('webhook'),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  headers: z.record(z.string()).optional(),
  auth: webhookAuthSchema.default({ type: 'none' }),
});

const databaseSinkSchema = z.object({
  type: z.literal('database'),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1),
  table: z.string().min(1),
  auth: databaseAuthSchema,
});

export const sinkSchema = z.discriminatedUnion('type', [
  kafkaSinkSchema,
  webhookSinkSchema,
  databaseSinkSchema,
]);

// Event route schema
export const eventRouteSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  filters: z.array(z.object({
    field: z.string().min(1, 'Field is required'),
    operator: z.enum(['equals', 'contains', 'starts_with', 'ends_with', 'regex']),
    value: z.string().min(1, 'Value is required'),
  })).default([]),
  sinkId: z.string().min(1, 'Sink selection is required'),
});

// Main Digital Twins schema
export const DigitalTwinsSchema = z.object({
  instances: z.number().int().min(1).max(6).default(1),
  sinks: z.array(sinkSchema).default([]),
  eventRoutes: z.array(eventRouteSchema).default([]),
  persistence: z.object({
    enabled: z.boolean().default(true),
    storageSize: z.string().regex(/^\d+Gi$/, 'Storage size must be in format like "10Gi"').default('10Gi'),
  }).default({}),
});

export type DigitalTwinsSettings = z.infer<typeof DigitalTwinsSchema>;
export type SinkConfig = z.infer<typeof sinkSchema>;
export type EventRouteConfig = z.infer<typeof eventRouteSchema>;

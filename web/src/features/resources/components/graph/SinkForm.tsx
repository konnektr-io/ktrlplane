import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Trash2 } from 'lucide-react';

interface SinkFormProps {
  form: UseFormReturn<Record<string, unknown>>;
  sinkIndex: number;
  onRemove: () => void;
}

export function SinkForm({ form, sinkIndex, onRemove }: SinkFormProps) {
  const sinkType = form.watch(`sinks.${sinkIndex}.type`);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sink Configuration</CardTitle>
            <CardDescription>
              Configure a data sink for event processing
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sink Name */}
        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., main-kafka-sink" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sink Type */}
        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sink type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="kafka">Kafka</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type-specific configuration */}
        {sinkType === "kafka" && (
          <KafkaConfigForm form={form} sinkIndex={sinkIndex} />
        )}
        {sinkType === "webhook" && (
          <WebhookConfigForm form={form} sinkIndex={sinkIndex} />
        )}
        {sinkType === "database" && (
          <DatabaseConfigForm form={form} sinkIndex={sinkIndex} />
        )}
      </CardContent>
    </Card>
  );
}

function KafkaConfigForm({
  form,
  sinkIndex,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  sinkIndex: number;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium">Kafka Configuration</h4>

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.bootstrapServers`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bootstrap Servers *</FormLabel>
            <FormControl>
              <Input placeholder="localhost:9092" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.topic`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topic *</FormLabel>
            <FormControl>
              <Input placeholder="events" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.securityProtocol`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Security Protocol</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="PLAINTEXT">PLAINTEXT</SelectItem>
                <SelectItem value="SSL">SSL</SelectItem>
                <SelectItem value="SASL_PLAINTEXT">SASL_PLAINTEXT</SelectItem>
                <SelectItem value="SASL_SSL">SASL_SSL</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {(form.watch(`sinks.${sinkIndex}.config.securityProtocol`) ===
        "SASL_PLAINTEXT" ||
        form.watch(`sinks.${sinkIndex}.config.securityProtocol`) ===
          "SASL_SSL") && (
        <>
          <FormField
            control={form.control}
            name={`sinks.${sinkIndex}.config.username`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sinks.${sinkIndex}.config.password`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}

function WebhookConfigForm({
  form,
  sinkIndex,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  sinkIndex: number;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium">Webhook Configuration</h4>

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.url`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL *</FormLabel>
            <FormControl>
              <Input placeholder="https://api.example.com/webhook" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.method`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>HTTP Method</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.authentication.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Authentication</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="basic">Basic Auth</SelectItem>
                <SelectItem value="apikey">API Key</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch(`sinks.${sinkIndex}.config.authentication.type`) ===
        "bearer" && (
        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.config.authentication.token`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bearer Token</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {form.watch(`sinks.${sinkIndex}.config.authentication.type`) ===
        "basic" && (
        <>
          <FormField
            control={form.control}
            name={`sinks.${sinkIndex}.config.authentication.username`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`sinks.${sinkIndex}.config.authentication.password`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
}

function DatabaseConfigForm({
  form,
  sinkIndex,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  sinkIndex: number;
}) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium">Database Configuration</h4>

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.type`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Database Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.config.host`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host *</FormLabel>
              <FormControl>
                <Input placeholder="localhost" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.config.port`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5432"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.database`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Database Name *</FormLabel>
            <FormControl>
              <Input placeholder="events_db" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.config.username`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`sinks.${sinkIndex}.config.password`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.table`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Table/Collection Name *</FormLabel>
            <FormControl>
              <Input placeholder="events" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`sinks.${sinkIndex}.config.ssl`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enable SSL</FormLabel>
              <div className="text-sm text-muted-foreground">
                Use SSL connection to the database
              </div>
            </div>
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

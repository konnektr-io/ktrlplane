import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecretSelector } from "../secret/SecretSelector";
import type { GraphSettings } from "../../schemas/GraphSchema";

interface KafkaSinkFormProps {
  form: UseFormReturn<GraphSettings>;
  index: number;
  projectId: string;
}

export function KafkaSinkForm({ form, index, projectId }: KafkaSinkFormProps) {
  const saslMechanism = form.watch(
    `eventSinks.kafka.${index}.saslMechanism`
  ) as string;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`eventSinks.kafka.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sink Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., kafka-prod" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.kafka.${index}.brokerList`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Broker List *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., broker1:9092,broker2:9092" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.kafka.${index}.topic`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topic *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., twin-events" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`eventSinks.kafka.${index}.securityProtocol`}
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
                  <SelectItem value="SASL_PLAINTEXT">SASL_PLAINTEXT</SelectItem>
                  <SelectItem value="SASL_SSL">SASL_SSL</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`eventSinks.kafka.${index}.saslMechanism`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SASL Mechanism</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="OAUTHBEARER">OAUTHBEARER</SelectItem>
                  <SelectItem value="PLAIN">PLAIN</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Authentication Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-4">Authentication</h4>

        {saslMechanism === "OAUTHBEARER" && (
          <div className="space-y-4">
            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.tenantIdRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.tenantIdRef`, ref)
              }
              label="Tenant ID"
              suggestedSecretType="oauth-client"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.clientIdRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.clientIdRef`, ref)
              }
              label="Client ID"
              suggestedSecretType="oauth-client"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.clientSecretRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.clientSecretRef`, ref)
              }
              label="Client Secret"
              suggestedSecretType="oauth-client"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.tokenEndpointRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.tokenEndpointRef`, ref)
              }
              label="Token Endpoint"
              suggestedSecretType="oauth-client"
            />
          </div>
        )}

        {saslMechanism === "PLAIN" && (
          <div className="space-y-4">
            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.saslUsernameRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.saslUsernameRef`, ref)
              }
              label="SASL Username"
              suggestedSecretType="kafka-plain"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.kafka.${index}.saslPasswordRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.kafka.${index}.saslPasswordRef`, ref)
              }
              label="SASL Password"
              suggestedSecretType="kafka-plain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

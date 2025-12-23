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

interface MqttSinkFormProps {
  form: UseFormReturn<any>;
  index: number;
  projectId: string;
}

export function MqttSinkForm({ form, index, projectId }: MqttSinkFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`eventSinks.mqtt.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sink Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., mqtt-broker" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`eventSinks.mqtt.${index}.broker`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broker Address *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., mqtt.example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`eventSinks.mqtt.${index}.port`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1883"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`eventSinks.mqtt.${index}.topic`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topic *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., twin/events" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`eventSinks.mqtt.${index}.clientId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client ID *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., konnektr-graph" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`eventSinks.mqtt.${index}.protocolVersion`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Protocol Version</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="3.1.0">MQTT 3.1.0</SelectItem>
                  <SelectItem value="3.1.1">MQTT 3.1.1</SelectItem>
                  <SelectItem value="5.0.0">MQTT 5.0.0</SelectItem>
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

        <div className="space-y-4">
          <h5 className="text-sm font-medium">Basic Credentials</h5>
          <SecretSelector
            projectId={projectId}
            value={form.watch(`eventSinks.mqtt.${index}.usernameRef`)}
            onChange={(ref: string) =>
              form.setValue(`eventSinks.mqtt.${index}.usernameRef`, ref)
            }
            label="Username"
            suggestedSecretType="mqtt-credentials"
          />

          <SecretSelector
            projectId={projectId}
            value={form.watch(`eventSinks.mqtt.${index}.passwordRef`)}
            onChange={(ref: string) =>
              form.setValue(`eventSinks.mqtt.${index}.passwordRef`, ref)
            }
            label="Password"
            suggestedSecretType="mqtt-credentials"
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h5 className="text-sm font-medium mb-2">
            OAuth (Optional, for Azure IoT Hub)
          </h5>
          <div className="space-y-4">
            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.mqtt.${index}.tokenEndpointRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.mqtt.${index}.tokenEndpointRef`, ref)
              }
              label="Token Endpoint"
              suggestedSecretType="oauth-client"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.mqtt.${index}.tenantIdRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.mqtt.${index}.tenantIdRef`, ref)
              }
              label="Tenant ID"
              suggestedSecretType="oauth-client"
            />

            <SecretSelector
              projectId={projectId}
              value={form.watch(`eventSinks.mqtt.${index}.clientSecretRef`)}
              onChange={(ref: string) =>
                form.setValue(`eventSinks.mqtt.${index}.clientSecretRef`, ref)
              }
              label="Client Secret"
              suggestedSecretType="oauth-client"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

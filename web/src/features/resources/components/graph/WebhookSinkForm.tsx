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
import { SecretSelector } from "./SecretSelector";

interface WebhookSinkFormProps {
  form: UseFormReturn<any>;
  index: number;
  projectId: string;
}

export function WebhookSinkForm({
  form,
  index,
  projectId,
}: WebhookSinkFormProps) {
  const authType = form.watch(
    `eventSinks.webhook.${index}.authenticationType`
  ) as string;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`eventSinks.webhook.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sink Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., webhook-prod" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.webhook.${index}.url`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Webhook URL *</FormLabel>
            <FormControl>
              <Input
                placeholder="https://api.example.com/webhooks/events"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.webhook.${index}.method`}
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
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Authentication Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-4">Authentication</h4>

        <FormField
          control={form.control}
          name={`eventSinks.webhook.${index}.authenticationType`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Authentication Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Basic">Basic Auth</SelectItem>
                  <SelectItem value="Bearer">Bearer Token</SelectItem>
                  <SelectItem value="ApiKey">API Key (Header)</SelectItem>
                  <SelectItem value="OAuth">OAuth 2.0</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {authType !== "None" && (
          <div className="mt-4 space-y-4">
            {authType === "Basic" && (
              <>
                <SecretSelector
                  projectId={projectId}
                  value={form.watch(`eventSinks.webhook.${index}.usernameRef`)}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.usernameRef`,
                      ref
                    )
                  }
                  label="Username"
                  suggestedSecretType="basic-auth"
                />

                <SecretSelector
                  projectId={projectId}
                  value={form.watch(`eventSinks.webhook.${index}.passwordRef`)}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.passwordRef`,
                      ref
                    )
                  }
                  label="Password"
                  suggestedSecretType="basic-auth"
                />
              </>
            )}

            {authType === "Bearer" && (
              <SecretSelector
                projectId={projectId}
                value={form.watch(`eventSinks.webhook.${index}.tokenRef`)}
                onChange={(ref: string) =>
                  form.setValue(`eventSinks.webhook.${index}.tokenRef`, ref)
                }
                label="Bearer Token"
                suggestedSecretType="bearer-token"
              />
            )}

            {authType === "ApiKey" && (
              <>
                <SecretSelector
                  projectId={projectId}
                  value={form.watch(
                    `eventSinks.webhook.${index}.headerNameRef`
                  )}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.headerNameRef`,
                      ref
                    )
                  }
                  label="Header Name"
                  suggestedSecretType="api-key"
                />

                <SecretSelector
                  projectId={projectId}
                  value={form.watch(
                    `eventSinks.webhook.${index}.headerValueRef`
                  )}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.headerValueRef`,
                      ref
                    )
                  }
                  label="Header Value (API Key)"
                  suggestedSecretType="api-key"
                />
              </>
            )}

            {authType === "OAuth" && (
              <>
                <SecretSelector
                  projectId={projectId}
                  value={form.watch(
                    `eventSinks.webhook.${index}.tokenEndpointRef`
                  )}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.tokenEndpointRef`,
                      ref
                    )
                  }
                  label="Token Endpoint"
                  suggestedSecretType="oauth-client"
                />

                <SecretSelector
                  projectId={projectId}
                  value={form.watch(`eventSinks.webhook.${index}.clientIdRef`)}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.clientIdRef`,
                      ref
                    )
                  }
                  label="Client ID"
                  suggestedSecretType="oauth-client"
                />

                <SecretSelector
                  projectId={projectId}
                  value={form.watch(
                    `eventSinks.webhook.${index}.clientSecretRef`
                  )}
                  onChange={(ref: string) =>
                    form.setValue(
                      `eventSinks.webhook.${index}.clientSecretRef`,
                      ref
                    )
                  }
                  label="Client Secret"
                  suggestedSecretType="oauth-client"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

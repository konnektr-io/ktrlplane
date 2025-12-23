import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SecretSelector } from "../secret/SecretSelector";

interface KustoSinkFormProps {
  form: UseFormReturn<any>;
  index: number;
  projectId: string;
}

export function KustoSinkForm({ form, index, projectId }: KustoSinkFormProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`eventSinks.kusto.${index}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sink Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., kusto-prod" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.kusto.${index}.ingestionUri`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ingestion URI *</FormLabel>
            <FormControl>
              <Input
                placeholder="https://ingest-{cluster}.{region}.kusto.windows.net"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={`eventSinks.kusto.${index}.database`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Database *</FormLabel>
            <FormControl>
              <Input placeholder="e.g., TwinEvents" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Table Mappings (Optional)</h4>
        <p className="text-sm text-muted-foreground">
          Specify custom table names for different event types
        </p>

        <FormField
          control={form.control}
          name={`eventSinks.kusto.${index}.propertyEventsTable`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Events Table</FormLabel>
              <FormControl>
                <Input placeholder="e.g., PropertyEvents" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`eventSinks.kusto.${index}.twinLifeCycleEventsTable`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twin Lifecycle Events Table</FormLabel>
              <FormControl>
                <Input placeholder="e.g., TwinLifecycle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`eventSinks.kusto.${index}.relationshipLifeCycleEventsTable`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Lifecycle Events Table</FormLabel>
              <FormControl>
                <Input placeholder="e.g., RelationshipLifecycle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Authentication Section */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-4">Authentication</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Configure Azure AD Service Principal credentials
        </p>

        <div className="space-y-4">
          <SecretSelector
            projectId={projectId}
            value={form.watch(`eventSinks.kusto.${index}.tenantIdRef`)}
            onChange={(ref: string) =>
              form.setValue(`eventSinks.kusto.${index}.tenantIdRef`, ref)
            }
            label="Tenant ID"
            suggestedSecretType="oauth-client"
          />

          <SecretSelector
            projectId={projectId}
            value={form.watch(`eventSinks.kusto.${index}.clientIdRef`)}
            onChange={(ref: string) =>
              form.setValue(`eventSinks.kusto.${index}.clientIdRef`, ref)
            }
            label="Client ID"
            suggestedSecretType="oauth-client"
          />

          <SecretSelector
            projectId={projectId}
            value={form.watch(`eventSinks.kusto.${index}.clientSecretRef`)}
            onChange={(ref: string) =>
              form.setValue(`eventSinks.kusto.${index}.clientSecretRef`, ref)
            }
            label="Client Secret"
            suggestedSecretType="oauth-client"
          />
        </div>
      </div>
    </div>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { resourceSchemas, defaultConfigurations } from "@/features/resources/schemas";

interface FlowsFormProps {
  initialValues?: any;
  onSubmit: (values: any) => void;
  disabled?: boolean;
}

export function FlowsForm({ initialValues, onSubmit, disabled }: FlowsFormProps) {
  const schema = resourceSchemas['Konnektr.Flows'];
  const defaultValues = initialValues || defaultConfigurations['Konnektr.Flows'];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Flow Configuration</CardTitle>
            <CardDescription>Configure your containerized application flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="replicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Replicas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoscaling.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Autoscaling</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Automatically scale based on CPU usage
                    </div>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('autoscaling.enabled') && (
              <>
                <FormField
                  control={form.control}
                  name="autoscaling.minReplicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Replicas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoscaling.maxReplicas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Replicas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoscaling.targetCPU"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target CPU Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 70)}
                          disabled={disabled}
                        />
                      </FormControl>
                      <div className="text-sm text-muted-foreground">
                        Scale when CPU usage exceeds this percentage
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment Variables</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {field.value?.length || 0} environment variables configured
                      </div>
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <p className="text-xs text-muted-foreground">
                          Environment variables configuration available via JSON editor
                        </p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={disabled} className="w-full">
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}

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
import { resourceSchemas, defaultConfigurations } from "@/features/resources/schemas";

interface ResourceSettingsFormProps {
  resourceType: string;
  initialValues?: any;
  onSubmit: (values: any) => void;
  disabled?: boolean;
}

export function ResourceSettingsForm({ resourceType, initialValues, onSubmit, disabled }: ResourceSettingsFormProps) {
  // Handle different resource types with proper typing
  if (resourceType === 'Konnektr.DigitalTwins') {
    return <DigitalTwinsForm initialValues={initialValues} onSubmit={onSubmit} disabled={disabled} />;
  }
  
  if (resourceType === 'Konnektr.Flows') {
    return <FlowsForm initialValues={initialValues} onSubmit={onSubmit} disabled={disabled} />;
  }

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Unknown resource type: {resourceType}</p>
    </div>
  );
}

// Digital Twins Form Component
function DigitalTwinsForm({ initialValues, onSubmit, disabled }: Omit<ResourceSettingsFormProps, 'resourceType'>) {
  const schema = resourceSchemas['Konnektr.DigitalTwins'];
  const defaultValues = initialValues || defaultConfigurations['Konnektr.DigitalTwins'];

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Instances Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Digital Twins Configuration</CardTitle>
            <CardDescription>Configure your Age Graph Database instances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="instances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Instances</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={disabled}
          className="w-full"
        >
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}

// Flows Form Component  
function FlowsForm({ initialValues, onSubmit, disabled }: Omit<ResourceSettingsFormProps, 'resourceType'>) {
  const schema = resourceSchemas['Konnektr.Flows'];
  const defaultValues = initialValues || defaultConfigurations['Konnektr.Flows'];

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Configuration */}
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
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={disabled}
          className="w-full"
        >
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}

export default ResourceSettingsForm;

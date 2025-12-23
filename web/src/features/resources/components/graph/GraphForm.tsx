import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSinksTab } from "./EventSinksTab";
import { EventRoutesTab } from "./EventRoutesTab";
import type { GraphSettings } from "../../schemas/GraphSchema";

interface GraphFormProps {
  initialValues?: GraphSettings;
  onSubmit: (values: GraphSettings) => void;
  disabled?: boolean;
  projectId: string;
}

export function GraphForm({
  initialValues,
  onSubmit,
  disabled,
  projectId,
}: GraphFormProps) {
  const defaultValues: GraphSettings = initialValues || {
    eventSinks: {
      kafka: [],
      kusto: [],
      mqtt: [],
      webhook: [],
    },
    eventRoutes: [],
  };

  const form = useForm({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="sinks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sinks">Event Sinks</TabsTrigger>
            <TabsTrigger value="routes">Event Routes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sinks" className="mt-6">
            <EventSinksTab form={form as any} projectId={projectId} />
          </TabsContent>
          
          <TabsContent value="routes" className="mt-6">
            <EventRoutesTab form={form as any} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={disabled} size="lg">
            Save Configuration and Deploy
          </Button>
        </div>
      </form>
    </Form>
  );
}

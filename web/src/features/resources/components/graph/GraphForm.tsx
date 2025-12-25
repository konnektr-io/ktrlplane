import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventSinksTab } from "./EventSinksTab";
import { EventRoutesTab } from "./EventRoutesTab";
import type { GraphSettings } from "../../schemas/GraphSchema";

interface GraphFormProps {
  initialValues?: GraphSettings;
  onSave: (values: GraphSettings) => Promise<void>;
  disabled?: boolean;
  projectId: string;
  hideSaveButtons?: boolean;
  resourceSku?: string;
}

const defaultGraphSettings: GraphSettings = {
  eventSinks: {
    kafka: [],
    kusto: [],
    mqtt: [],
    webhook: [],
  },
  eventRoutes: [],
};

export function GraphForm({
  initialValues,
  onSave,
  disabled,
  projectId,
  hideSaveButtons,
  resourceSku,
}: GraphFormProps) {
  const form = useForm<GraphSettings>({
    defaultValues: initialValues ?? defaultGraphSettings,
  });

  const handleSave = async () => {
    const values = form.getValues();
    await onSave(values);
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Tabs defaultValue="sinks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sinks">Event Sinks</TabsTrigger>
            <TabsTrigger value="routes">Event Routes</TabsTrigger>
          </TabsList>

          <TabsContent value="sinks" className="mt-6">
            <EventSinksTab
              form={form}
              projectId={projectId}
              onSave={handleSave}
              disabled={disabled || resourceSku === 'free'}
              hideSaveButtons={hideSaveButtons}
              resourceSku={resourceSku}
            />
          </TabsContent>

          <TabsContent value="routes" className="mt-6">
            <EventRoutesTab
              form={form}
              onSave={handleSave}
              disabled={disabled || resourceSku === 'free'}
              hideSaveButtons={hideSaveButtons}
              resourceSku={resourceSku}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Form>
  );
}

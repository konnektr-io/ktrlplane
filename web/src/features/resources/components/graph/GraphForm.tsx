import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import {
  resourceSchemas,
  defaultConfigurations,
} from "@/features/resources/schemas";
import type { GraphSettings } from "@/features/resources/schemas/GraphSchema";

interface GraphFormProps {
  initialValues?: GraphSettings;
  onSubmit: (values: GraphSettings) => void;
  disabled?: boolean;
}

export function GraphForm({
  initialValues,
  onSubmit,
  disabled,
}: GraphFormProps) {
  const schema = resourceSchemas["Konnektr.Graph"];
  const defaultValues =
    initialValues || defaultConfigurations["Konnektr.Graph"];

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    fields: kafkaFields,
    append: appendKafka,
    remove: removeKafka,
  } = useFieldArray({
    control: form.control,
    name: "eventSinks.kafka",
  });

  const {
    fields: kustoFields,
    append: appendKusto,
    remove: removeKusto,
  } = useFieldArray({
    control: form.control,
    name: "eventSinks.kusto",
  });

  const {
    fields: routeFields,
    append: appendRoute,
    remove: removeRoute,
  } = useFieldArray({
    control: form.control,
    name: "eventRoutes",
  });

  // Get all available sink names for the route dropdown
  const allSinks = form.watch();
  const availableSinkNames = [
    ...(allSinks.eventSinks?.kafka?.map(
      (sink: { name: string }) => sink.name
    ) || []),
    ...(allSinks.eventSinks?.kusto?.map(
      (sink: { name: string }) => sink.name
    ) || []),
  ].filter(Boolean);

  const handleAddKafkaSink = () => {
    appendKafka({
      name: "",
      brokerList: "",
      topic: "",
      saslMechanism: "OAUTHBEARER",
    });
  };

  const handleAddKustoSink = () => {
    appendKusto({
      name: "",
      ingestionUri: "",
      database: "",
    });
  };

  const handleAddRoute = () => {
    appendRoute({
      sinkName: "",
      eventFormat: "EventNotification",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Kafka Sinks */}
        <Card>
          <CardHeader>
            <CardTitle>Kafka Event Sinks</CardTitle>
            <CardDescription>
              Configure Kafka sinks for event streaming with federated
              credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {kafkaFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Kafka Sink {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeKafka(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eventSinks.kafka.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sink Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="my-kafka-sink"
                            {...field}
                            disabled={disabled}
                          />
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
                        <FormLabel>Broker List</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="broker1:9092,broker2:9092"
                            {...field}
                            disabled={disabled}
                          />
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
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="digital-twins-events"
                            {...field}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`eventSinks.kafka.${index}.saslMechanism`}
                    render={() => (
                      <FormItem>
                        <FormLabel>SASL Mechanism</FormLabel>
                        <FormControl>
                          <Input
                            value="OAUTHBEARER"
                            readOnly
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <div className="text-sm text-muted-foreground">
                          Uses federated credentials (OAUTHBEARER only)
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddKafkaSink}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Kafka Sink
            </Button>
          </CardContent>
        </Card>

        {/* Kusto Sinks */}
        <Card>
          <CardHeader>
            <CardTitle>Kusto Event Sinks</CardTitle>
            <CardDescription>
              Configure Azure Data Explorer (Kusto) sinks with federated
              credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {kustoFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Kusto Sink {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeKusto(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eventSinks.kusto.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sink Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="my-kusto-sink"
                            {...field}
                            disabled={disabled}
                          />
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
                        <FormLabel>Ingestion URI</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://mycluster.eastus.kusto.windows.net"
                            {...field}
                            disabled={disabled}
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
                        <FormLabel>Database</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MyDatabase"
                            {...field}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddKustoSink}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Kusto Sink
            </Button>
          </CardContent>
        </Card>

        {/* Event Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Event Routes</CardTitle>
            <CardDescription>
              Configure routing rules to send events to specific sinks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {routeFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Event Route {index + 1}
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRoute(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`eventRoutes.${index}.sinkName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Sink</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger disabled={disabled}>
                              <SelectValue placeholder="Select a sink" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableSinkNames.map((sinkName) => (
                              <SelectItem key={sinkName} value={sinkName}>
                                {sinkName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableSinkNames.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            Add sinks above to create routes
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`eventRoutes.${index}.eventFormat`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger disabled={disabled}>
                              <SelectValue placeholder="Select event format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EventNotification">
                              Event Notification
                            </SelectItem>
                            <SelectItem value="DataHistory">
                              Data History
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRoute}
              disabled={disabled || availableSinkNames.length === 0}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event Route
            </Button>

            {availableSinkNames.length === 0 && (
              <div className="text-sm text-muted-foreground text-center">
                Create at least one sink to add event routes
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={disabled} className="w-full">
          Save Configuration
        </Button>
      </form>
    </Form>
  );
}

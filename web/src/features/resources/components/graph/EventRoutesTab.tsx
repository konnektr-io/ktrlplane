import { UseFormReturn } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { GraphSettings } from "../../schemas/GraphSchema";

interface EventRoutesTabProps {
  form: UseFormReturn<GraphSettings>;
}

export function EventRoutesTab({ form }: EventRoutesTabProps) {
  const eventRoutes = form.watch("eventRoutes") || [];
  const eventSinks = form.watch("eventSinks") || {
    kafka: [],
    kusto: [],
    mqtt: [],
    webhook: [],
  };

  // Get all sink names
  const allSinkNames = [
    ...eventSinks.kafka.map((s) => s.name),
    ...eventSinks.kusto.map((s) => s.name),
    ...eventSinks.mqtt.map((s) => s.name),
    ...eventSinks.webhook.map((s) => s.name),
  ].filter(Boolean);

  const addRoute = () => {
    const currentRoutes = form.getValues("eventRoutes") || [];
    form.setValue("eventRoutes", [
      ...currentRoutes,
      {
        sinkName: "",
        eventFormat: "EventNotification" as const,
        typeMappings: {},
      },
    ]);
  };

  const removeRoute = (index: number) => {
    const currentRoutes = form.getValues("eventRoutes") || [];
    form.setValue(
      "eventRoutes",
      currentRoutes.filter((_, i) => i !== index)
    );
  };

  const addTypeMapping = (routeIndex: number) => {
    const currentMappings = form.getValues(
      `eventRoutes.${routeIndex}.typeMappings`
    ) || {};
    const newKey = `EventType${Object.keys(currentMappings).length + 1}`;
    form.setValue(`eventRoutes.${routeIndex}.typeMappings`, {
      ...currentMappings,
      [newKey]: "",
    });
  };

  const removeTypeMapping = (routeIndex: number, key: string) => {
    const currentMappings = form.getValues(
      `eventRoutes.${routeIndex}.typeMappings`
    ) || {};
    const { [key]: _, ...rest } = currentMappings;
    form.setValue(`eventRoutes.${routeIndex}.typeMappings`, rest);
  };

  const updateTypeMappingKey = (
    routeIndex: number,
    oldKey: string,
    newKey: string
  ) => {
    const currentMappings = form.getValues(
      `eventRoutes.${routeIndex}.typeMappings`
    ) || {};
    const value = currentMappings[oldKey];
    const { [oldKey]: _, ...rest } = currentMappings;
    form.setValue(`eventRoutes.${routeIndex}.typeMappings`, {
      ...rest,
      [newKey]: value,
    });
  };

  const updateTypeMappingValue = (
    routeIndex: number,
    key: string,
    value: string
  ) => {
    const currentMappings = form.getValues(
      `eventRoutes.${routeIndex}.typeMappings`
    ) || {};
    form.setValue(`eventRoutes.${routeIndex}.typeMappings`, {
      ...currentMappings,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Routes</CardTitle>
          <CardDescription>
            Configure how events are routed to your sinks. Each route specifies
            a destination sink, event format, and optional type mappings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSinkNames.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>
                You need to configure at least one event sink before creating
                routes.
              </p>
              <p className="text-sm mt-2">
                Switch to the "Event Sinks" tab to add a sink.
              </p>
            </div>
          ) : (
            <Button onClick={addRoute} type="button">
              <Plus className="h-4 w-4 mr-2" />
              Add Event Route
            </Button>
          )}
        </CardContent>
      </Card>

      {eventRoutes.length === 0 && allSinkNames.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No event routes configured yet. Add a route to start sending
              events to your sinks.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {eventRoutes.map((_, routeIndex) => {
          const typeMappings =
            form.watch(`eventRoutes.${routeIndex}.typeMappings`) || {};

          return (
            <Card key={routeIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Event Route #{routeIndex + 1}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoute(routeIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={`eventRoutes.${routeIndex}.sinkName`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Sink *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a sink" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allSinkNames.map((sinkName) => (
                            <SelectItem key={sinkName} value={sinkName}>
                              {sinkName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`eventRoutes.${routeIndex}.eventFormat`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EventNotification">
                            Event Notification
                          </SelectItem>
                          <SelectItem value="DataHistory">
                            Data History
                          </SelectItem>
                          <SelectItem value="Telemetry">Telemetry</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        Format of the CloudEvent sent to the sink
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type Mappings */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-medium">
                        Event Type Mappings (Optional)
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Map event types to specific tables/topics in the sink
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addTypeMapping(routeIndex)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Mapping
                    </Button>
                  </div>

                  {Object.keys(typeMappings).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No type mappings configured. Events will use default
                      routing.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(typeMappings).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <Input
                            placeholder="Event Type (e.g., TwinCreate)"
                            value={key}
                            onChange={(e) =>
                              updateTypeMappingKey(
                                routeIndex,
                                key,
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <Input
                            placeholder="Table/Topic name"
                            value={value as string}
                            onChange={(e) =>
                              updateTypeMappingValue(
                                routeIndex,
                                key,
                                e.target.value
                              )
                            }
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTypeMapping(routeIndex, key)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Loader2,
} from "lucide-react";
import type { EventRoute, GraphSettings } from "../../schemas/GraphSchema";
import { useState, Fragment } from "react";

interface EventRoutesTabProps {
  form: UseFormReturn<GraphSettings>;
  onSave: () => Promise<void>;
  disabled?: boolean;
}

// Supported event types for each format
const eventTypeOptions: Record<
  EventRoute["eventFormat"],
  { key: string; label: string }[]
> = {
  EventNotification: [
    { key: "TwinCreate", label: "Twin Create" },
    { key: "TwinUpdate", label: "Twin Update" },
    { key: "TwinDelete", label: "Twin Delete" },
    { key: "RelationshipCreate", label: "Relationship Create" },
    { key: "RelationshipUpdate", label: "Relationship Update" },
    { key: "RelationshipDelete", label: "Relationship Delete" },
  ],
  Telemetry: [
    { key: "TwinCreate", label: "Twin Create" },
    { key: "TwinUpdate", label: "Twin Update" },
    { key: "TwinDelete", label: "Twin Delete" },
    { key: "RelationshipCreate", label: "Relationship Create" },
    { key: "RelationshipUpdate", label: "Relationship Update" },
    { key: "RelationshipDelete", label: "Relationship Delete" },
    { key: "Telemetry", label: "Telemetry" },
  ],
  DataHistory: [
    { key: "PropertyEvent", label: "Property Event" },
    { key: "TwinLifecycle", label: "Twin Lifecycle" },
    { key: "RelationshipLifecycle", label: "Relationship Lifecycle" },
  ],
};

export function EventRoutesTab({
  form,
  onSave,
  disabled,
}: EventRoutesTabProps) {
  const [expandedRoutes, setExpandedRoutes] = useState<Set<number>>(new Set());
  const [savingRoute, setSavingRoute] = useState<number | null>(null);

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

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRoutes(newExpanded);
  };

  const addRoute = () => {
    const currentRoutes = form.getValues("eventRoutes") || [];
    form.setValue("eventRoutes", [
      ...currentRoutes,
      {
        name: `Route #${currentRoutes.length + 1}`,
        sinkName: "",
        eventFormat: "EventNotification" as const,
      },
    ]);
    // Auto-expand the new route
    setExpandedRoutes(new Set([...expandedRoutes, currentRoutes.length]));
  };

  const removeRoute = (index: number) => {
    const currentRoutes = form.getValues("eventRoutes") || [];
    form.setValue(
      "eventRoutes",
      currentRoutes.filter((_, i) => i !== index)
    );
    // Remove from expanded set
    const newExpanded = new Set(expandedRoutes);
    newExpanded.delete(index);
    setExpandedRoutes(newExpanded);
  };

  const handleSaveRoute = async (routeIndex: number) => {
    setSavingRoute(routeIndex);
    try {
      await onSave();
    } finally {
      setSavingRoute(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Routes</CardTitle>
              <CardDescription>
                Configure how events are routed to your sinks
              </CardDescription>
            </div>
            {allSinkNames.length > 0 && (
              <Button onClick={addRoute} type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allSinkNames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>
                You need to configure at least one event sink before creating
                routes
              </p>
              <p className="text-sm mt-1">
                Switch to the "Event Sinks" tab to add a sink
              </p>
            </div>
          ) : (
            <>
              {eventRoutes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No event routes configured yet</p>
                  <p className="text-sm mt-1">
                    Click "Add Route" to create your first route
                  </p>
                </div>
              )}

              {eventRoutes.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Sink</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Mappings</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventRoutes.map((route, routeIndex) => {
                      const isExpanded = expandedRoutes.has(routeIndex);
                      const typeMappings = form.watch(
                        `eventRoutes.${routeIndex}.typeMappings`
                      );
                      const mappingCount =
                        (typeof typeMappings === "object" &&
                          Object.keys(typeMappings).length) ||
                        0;

                      return (
                        <Fragment key={routeIndex}>
                          <TableRow className="cursor-pointer hover:bg-muted/50">
                            <TableCell
                              onClick={() => toggleExpanded(routeIndex)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell
                              onClick={() => toggleExpanded(routeIndex)}
                            >
                              {route.name || (
                                <span>Route #{routeIndex + 1}</span>
                              )}
                            </TableCell>
                            <TableCell
                              onClick={() => toggleExpanded(routeIndex)}
                            >
                              {route.sinkName || (
                                <span className="text-muted-foreground italic">
                                  Not set
                                </span>
                              )}
                            </TableCell>
                            <TableCell
                              onClick={() => toggleExpanded(routeIndex)}
                            >
                              {route.eventFormat || "EventNotification"}
                            </TableCell>
                            <TableCell
                              onClick={() => toggleExpanded(routeIndex)}
                            >
                              {mappingCount > 0 ? (
                                `${mappingCount} mapping${
                                  mappingCount !== 1 ? "s" : ""
                                }`
                              ) : (
                                <span className="text-muted-foreground italic">
                                  None
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRoute(routeIndex);
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${routeIndex}-details`}>
                              <TableCell
                                colSpan={6}
                                className="bg-muted/30 p-6"
                              >
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`eventRoutes.${routeIndex}.name`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Route Name</FormLabel>
                                          <Input
                                            {...field}
                                            placeholder="Enter a name for this route"
                                            disabled={disabled}
                                          />
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                      control={form.control}
                                      name={`eventRoutes.${routeIndex}.sinkName`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Sink Name</FormLabel>
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
                                                <SelectItem
                                                  key={sinkName}
                                                  value={sinkName}
                                                >
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
                                              <SelectItem value="Telemetry">
                                                Telemetry
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <FormLabel>
                                          Event Type Mappings
                                        </FormLabel>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Optionally map event types to custom
                                          values for Azure Digital Twins
                                          compatibility
                                        </p>
                                      </div>
                                      <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={!!typeMappings}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                form.setValue(
                                                  `eventRoutes.${routeIndex}.typeMappings`,
                                                  {}
                                                );
                                              } else {
                                                form.setValue(
                                                  `eventRoutes.${routeIndex}.typeMappings`,
                                                  undefined
                                                );
                                              }
                                            }}
                                            disabled={disabled}
                                          />
                                          <span className="text-sm">
                                            Enable custom event type mappings
                                          </span>
                                        </label>
                                      </div>
                                    </div>

                                    {!!typeMappings && (
                                      <div className="space-y-2 border rounded-lg p-3">
                                        {eventTypeOptions[
                                          route.eventFormat ||
                                            "EventNotification"
                                        ].map(({ key, label }) => (
                                          <div
                                            key={key}
                                            className="flex gap-2 items-center"
                                          >
                                            <span className="w-40 text-sm font-medium text-muted-foreground">
                                              {label}
                                            </span>
                                            <span className="text-muted-foreground">
                                              →
                                            </span>
                                            <Input
                                              placeholder="Mapped Value (optional)"
                                              value={typeMappings[key] || ""}
                                              onChange={(e) => {
                                                const newMappings = {
                                                  ...typeMappings,
                                                  [key]: e.target.value,
                                                };
                                                form.setValue(
                                                  `eventRoutes.${routeIndex}.typeMappings`,
                                                  newMappings
                                                );
                                              }}
                                              className="flex-1"
                                              disabled={disabled}
                                            />
                                          </div>
                                        ))}
                                        <div className="text-muted-foreground text-xs mt-2">
                                          Leave blank to use backend defaults
                                          for each event type.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t mt-4">
                                  <Button
                                    type="button"
                                    onClick={() => handleSaveRoute(routeIndex)}
                                    disabled={
                                      disabled || savingRoute === routeIndex
                                    }
                                  >
                                    {savingRoute === routeIndex ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Route
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

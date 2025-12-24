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
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KafkaSinkForm } from "./KafkaSinkForm";
import { KustoSinkForm } from "./KustoSinkForm";
import { MqttSinkForm } from "./MqttSinkForm";
import { WebhookSinkForm } from "./WebhookSinkForm";
import type {
  GraphSettings,
  KafkaSink,
  KustoSink,
  MqttSink,
  WebhookSink,
} from "../../schemas/GraphSchema";
import { useState, Fragment } from "react";

interface EventSinksTabProps {
  form: UseFormReturn<GraphSettings>;
  projectId: string;
  onSave: () => Promise<void>;
  disabled?: boolean;
  hideSaveButtons?: boolean;
}

type SinkType = "kafka" | "kusto" | "mqtt" | "webhook";

interface SinkItem {
  type: SinkType;
  index: number;
  name: string;
  data: KafkaSink | KustoSink | MqttSink | WebhookSink;
}

export function EventSinksTab({
  form,
  projectId,
  onSave,
  disabled,
  hideSaveButtons,
}: EventSinksTabProps) {
  const [expandedSinks, setExpandedSinks] = useState<Set<string>>(new Set());
  const [savingSink, setSavingSink] = useState<string | null>(null);

  const kafkaSinks = form.watch("eventSinks.kafka") || [];
  const kustoSinks = form.watch("eventSinks.kusto") || [];
  const mqttSinks = form.watch("eventSinks.mqtt") || [];
  const webhookSinks = form.watch("eventSinks.webhook") || [];

  // Flatten all sinks into a single list
  const allSinks: SinkItem[] = [
    ...kafkaSinks.map((data: KafkaSink, index: number) => ({
      type: "kafka" as SinkType,
      index,
      name: data.name || `Kafka Sink ${index + 1}`,
      data,
    })),
    ...kustoSinks.map((data: KustoSink, index: number) => ({
      type: "kusto" as SinkType,
      index,
      name: data.name || `Kusto Sink ${index + 1}`,
      data,
    })),
    ...mqttSinks.map((data: MqttSink, index: number) => ({
      type: "mqtt" as SinkType,
      index,
      name: data.name || `MQTT Sink ${index + 1}`,
      data,
    })),
    ...webhookSinks.map((data: WebhookSink, index: number) => ({
      type: "webhook" as SinkType,
      index,
      name: data.name || `Webhook Sink ${index + 1}`,
      data,
    })),
  ];

  const toggleExpanded = (sinkId: string) => {
    const newExpanded = new Set(expandedSinks);
    if (newExpanded.has(sinkId)) {
      newExpanded.delete(sinkId);
    } else {
      newExpanded.add(sinkId);
    }
    setExpandedSinks(newExpanded);
  };

  const addSink = (sinkType: SinkType) => {
    const currentSinks = form.getValues(`eventSinks.${sinkType}`) || [];

    let newSink: KafkaSink | KustoSink | MqttSink | WebhookSink;
    switch (sinkType) {
      case "kafka":
        newSink = {
          name: "",
          brokerList: "",
          topic: "",
          saslMechanism: "OAUTHBEARER",
          securityProtocol: "SASL_SSL",
        };
        break;
      case "kusto":
        newSink = {
          name: "",
          ingestionUri: "",
          database: "",
        };
        break;
      case "mqtt":
        newSink = {
          name: "",
          broker: "",
          port: 8883,
          topic: "",
          clientId: "",
          protocolVersion: "5.0.0",
        };
        break;
      case "webhook":
        newSink = {
          name: "",
          url: "",
          method: "POST",
          authenticationType: "None",
        };
        break;
    }

    form.setValue(`eventSinks.${sinkType}`, [...currentSinks, newSink] as
      | KafkaSink[]
      | KustoSink[]
      | MqttSink[]
      | WebhookSink[]);
    // Auto-expand the new sink
    const newIndex = currentSinks.length;
    const sinkId = `${sinkType}-${newIndex}`;
    setExpandedSinks(new Set([...expandedSinks, sinkId]));
  };

  const removeSink = async (type: SinkType, index: number) => {
    const currentSinks = form.getValues(`eventSinks.${type}`) || [];
    form.setValue(
      `eventSinks.${type}` as any,
      currentSinks.filter((_: unknown, i: number) => i !== index)
    );
    // Remove from expanded set
    const sinkId = `${type}-${index}`;
    const newExpanded = new Set(expandedSinks);
    newExpanded.delete(sinkId);
    setExpandedSinks(newExpanded);
    await onSave();
  };

  const getSinkTypeLabel = (type: SinkType): string => {
    const labels: Record<SinkType, string> = {
      kafka: "Kafka",
      kusto: "Azure Data Explorer",
      mqtt: "MQTT",
      webhook: "Webhook",
    };
    return labels[type];
  };

  const handleSaveSink = async (sinkId: string) => {
    setSavingSink(sinkId);
    try {
      await onSave();
    } finally {
      setSavingSink(null);
    }
  };

  const renderSinkForm = (sink: SinkItem) => {
    const commonProps = {
      form,
      index: sink.index,
      projectId,
    };

    switch (sink.type) {
      case "kafka":
        return <KafkaSinkForm {...commonProps} />;
      case "kusto":
        return <KustoSinkForm {...commonProps} />;
      case "mqtt":
        return <MqttSinkForm {...commonProps} />;
      case "webhook":
        return <WebhookSinkForm {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Sinks</CardTitle>
              <CardDescription>
                Configure destinations where events will be sent
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sink
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addSink("kafka")}>
                  Kafka
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSink("kusto")}>
                  Kusto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSink("mqtt")}>
                  MQTT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSink("webhook")}>
                  Webhook
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {allSinks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No event sinks configured yet</p>
              <p className="text-sm mt-1">
                Click "Add Sink" to create your first sink
              </p>
            </div>
          )}

          {allSinks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSinks.map((sink) => {
                  const sinkId = `${sink.type}-${sink.index}`;
                  const isExpanded = expandedSinks.has(sinkId);

                  return (
                    <Fragment key={sinkId}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={() => toggleExpanded(sinkId)}>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell onClick={() => toggleExpanded(sinkId)}>
                          {sink.name || (
                            <span className="text-muted-foreground italic">
                              Unnamed
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={() => toggleExpanded(sinkId)}>
                          {getSinkTypeLabel(sink.type)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSink(sink.type, sink.index);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${sinkId}-details`}>
                          <TableCell colSpan={4} className="bg-muted/30 p-6">
                            <div className="space-y-4">
                              {renderSinkForm(sink)}
                              {!hideSaveButtons && (
                                <div className="flex justify-end pt-4 border-t">
                                  <Button
                                    type="button"
                                    onClick={() => handleSaveSink(sinkId)}
                                    disabled={disabled || savingSink === sinkId}
                                  >
                                    {savingSink === sinkId ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Sink
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
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
        </CardContent>
      </Card>
    </div>
  );
}

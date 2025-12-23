import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import type { GraphSettings, KafkaSink, KustoSink, MqttSink, WebhookSink } from "../../schemas/GraphSchema";
import { useState } from "react";

interface EventSinksTabProps {
  form: UseFormReturn<GraphSettings>;
  projectId: string;
}

type SinkType = "kafka" | "kusto" | "mqtt" | "webhook";

interface SinkItem {
  type: SinkType;
  index: number;
  name: string;
  data: KafkaSink | KustoSink | MqttSink | WebhookSink;
}

export function EventSinksTab({ form, projectId }: EventSinksTabProps) {
  const [expandedSinks, setExpandedSinks] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [newSinkType, setNewSinkType] = useState<SinkType>("kafka");

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

  const addSink = () => {
    const currentSinks = form.getValues(`eventSinks.${newSinkType}`) || [];

    let newSink: KafkaSink | KustoSink | MqttSink | WebhookSink;
    switch (newSinkType) {
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

    form.setValue(`eventSinks.${newSinkType}`, [...currentSinks, newSink] as
      | KafkaSink[]
      | KustoSink[]
      | MqttSink[]
      | WebhookSink[]);
    setIsAdding(false);
    // Auto-expand the new sink
    const newIndex = currentSinks.length;
    const sinkId = `${newSinkType}-${newIndex}`;
    setExpandedSinks(new Set([...expandedSinks, sinkId]));
  };

  const removeSink = (type: SinkType, index: number) => {
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
            {!isAdding && (
              <Button onClick={() => setIsAdding(true)} type="button" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Sink
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <div className="flex gap-4 items-end mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <Label>Sink Type</Label>
                <Select
                  value={newSinkType}
                  onValueChange={(value: string) =>
                    setNewSinkType(value as SinkType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kafka">Kafka</SelectItem>
                    <SelectItem value="kusto">Kusto</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addSink} type="button">
                Add
              </Button>
              <Button
                onClick={() => setIsAdding(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )}

          {allSinks.length === 0 && !isAdding && (
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
                    <>
                      <TableRow
                        key={sinkId}
                        className="cursor-pointer hover:bg-muted/50"
                      >
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
                            {renderSinkForm(sink)}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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

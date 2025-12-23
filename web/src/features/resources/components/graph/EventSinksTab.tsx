import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { KafkaSinkForm } from "./KafkaSinkForm";
import { KustoSinkForm } from "./KustoSinkForm";
import { MqttSinkForm } from "./MqttSinkForm";
import { WebhookSinkForm } from "./WebhookSinkForm";
import type { GraphSettings } from "../../schemas/GraphSchema";
import { useState } from "react";

interface EventSinksTabProps {
  form: UseFormReturn<GraphSettings>;
  projectId: string;
}

export function EventSinksTab({ form, projectId }: EventSinksTabProps) {
  const [selectedSinkType, setSelectedSinkType] = useState<string>("kafka");

  const kafkaSinks = form.watch("eventSinks.kafka") || [];
  const kustoSinks = form.watch("eventSinks.kusto") || [];
  const mqttSinks = form.watch("eventSinks.mqtt") || [];
  const webhookSinks = form.watch("eventSinks.webhook") || [];

  const addSink = () => {
    const currentSinks = form.getValues(`eventSinks.${selectedSinkType}` as any) || [];
    
    let newSink: any;
    switch (selectedSinkType) {
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
          port: 1883,
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
    
    form.setValue(`eventSinks.${selectedSinkType}` as any, [...currentSinks, newSink]);
  };

  const removeSink = (type: string, index: number) => {
    const currentSinks = form.getValues(`eventSinks.${type}` as any) || [];
    form.setValue(
      `eventSinks.${type}` as any,
      currentSinks.filter((_: any, i: number) => i !== index)
    );
  };

  const totalSinks = kafkaSinks.length + kustoSinks.length + mqttSinks.length + webhookSinks.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Sinks</CardTitle>
          <CardDescription>
            Configure destinations where events will be sent. Each sink requires authentication credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Sink Type</Label>
              <Select value={selectedSinkType} onValueChange={setSelectedSinkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kafka">Kafka</SelectItem>
                  <SelectItem value="kusto">Azure Data Explorer (Kusto)</SelectItem>
                  <SelectItem value="mqtt">MQTT</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addSink} type="button">
              <Plus className="h-4 w-4 mr-2" />
              Add {selectedSinkType.charAt(0).toUpperCase() + selectedSinkType.slice(1)} Sink
            </Button>
          </div>
        </CardContent>
      </Card>

      {totalSinks === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No event sinks configured yet. Add a sink to start routing events.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {kafkaSinks.map((_, index) => (
          <KafkaSinkForm
            key={`kafka-${index}`}
            form={form}
            index={index}
            onRemove={() => removeSink("kafka", index)}
            projectId={projectId}
          />
        ))}

        {kustoSinks.map((_, index) => (
          <KustoSinkForm
            key={`kusto-${index}`}
            form={form}
            index={index}
            onRemove={() => removeSink("kusto", index)}
            projectId={projectId}
          />
        ))}

        {mqttSinks.map((_, index) => (
          <MqttSinkForm
            key={`mqtt-${index}`}
            form={form}
            index={index}
            onRemove={() => removeSink("mqtt", index)}
            projectId={projectId}
          />
        ))}

        {webhookSinks.map((_, index) => (
          <WebhookSinkForm
            key={`webhook-${index}`}
            form={form}
            index={index}
            onRemove={() => removeSink("webhook", index)}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
}

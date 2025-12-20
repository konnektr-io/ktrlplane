import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SecretSettings {
  secretType: string;
  data: Record<string, string>;
  [key: string]: unknown;
}

interface SecretFormProps {
  initialValues?: SecretSettings;
  onSubmit?: (values: SecretSettings) => void;
  onChange?: (values: SecretSettings) => void;
  disabled?: boolean;
  submitMode?: "auto" | "manual";
  hideSaveButton?: boolean;
}

export function SecretForm({
  initialValues,
  onSubmit,
  onChange,
  disabled,
  submitMode = "auto",
  hideSaveButton,
}: SecretFormProps) {
  const [secretType, setSecretType] = useState<string>(
    initialValues?.secretType || "generic"
  );
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);

  // Sync state with initialValues if provided
  useEffect(() => {
    if (initialValues) {
      setSecretType(initialValues.secretType || "generic");
      if (initialValues.data) {
        setPairs(
          Object.entries(initialValues.data).map(([key, value]) => ({
            key,
            value,
          }))
        );
      }
    }
  }, [initialValues]);

  const handlePairChange = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    const newPairs = [...pairs];
    newPairs[index][field] = newValue;
    setPairs(newPairs);
    newPairs[index][field] = newValue;
    setPairs(newPairs);
    notifyChange(secretType, newPairs);
  };

  const addPair = () => {
    setPairs([...pairs, { key: "", value: "" }]);
  };

  const removePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    notifyChange(secretType, newPairs);
  };

  // Helper to notify changes or submit
  const notifyChange = (
    currentType: string,
    currentPairs: { key: string; value: string }[]
  ) => {
    const data = createDataPayload(currentType, currentPairs);
    
    // Always fire onChange if provided
    onChange?.(data);

    // If auto mode, also fire onSubmit
    if (submitMode === "auto") {
      onSubmit?.(data);
    }
  };

  const createDataPayload = (currentType: string, currentPairs: { key: string; value: string }[]) => {
    const data = currentPairs.reduce((acc, pair) => {
        if (pair.key.trim()) {
          acc[pair.key.trim()] = pair.value;
        }
        return acc;
      }, {} as Record<string, string>);
    
    return {
        secretType: currentType,
        data,
    };
  };

  const manualSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const data = createDataPayload(secretType, pairs);
    onSubmit?.(data);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Secret Type</Label>
          <Select
            value={secretType}
            onValueChange={(val) => {
              setSecretType(val);
              setSecretType(val);
              notifyChange(val, pairs);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select secret type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generic">Generic (Opaque)</SelectItem>
              {/* Future types: tls, docker-registry, etc. */}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Generic secrets allow you to store any key-value pairs.
          </p>
        </div>

        <div className="space-y-4">
          <Label>Secret Values</Label>
          {pairs.map((pair, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Key (e.g. API_KEY)"
                  value={pair.key}
                  onChange={(e) =>
                    handlePairChange(index, "key", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  type="password"
                  placeholder="Value"
                  value={pair.value}
                  onChange={(e) =>
                    handlePairChange(index, "value", e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePair(index)}
                disabled={disabled || pairs.length === 1}
                className="mt-0.5 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        <Button
            onClick={addPair}
            disabled={disabled}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Key-Value Pair
          </Button>

          {!hideSaveButton && submitMode === "manual" && (
            <div className="pt-4 flex justify-end">
              <Button 
                type="button" 
                onClick={manualSubmit}
                disabled={disabled}
              >
                Save Secret
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

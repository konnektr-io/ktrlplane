import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { secretTypes, getSecretType } from "../../types/secretTypes";

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

  // Update pairs when secret type changes
  useEffect(() => {
    const type = getSecretType(secretType);
    if (type && type.keys.length > 0) {
      // For predefined types, create pairs for each key
      const newPairs = type.keys.map((keyDef) => ({
        key: keyDef.name,
        value: pairs.find((p) => p.key === keyDef.name)?.value || "",
      }));
      setPairs(newPairs);
      notifyChange(secretType, newPairs);
    } else if (secretType === "generic" && pairs.length === 0) {
      // For generic, ensure at least one empty pair
      setPairs([{ key: "", value: "" }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretType]);

  const handlePairChange = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    const newPairs = [...pairs];
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

  const createDataPayload = (
    currentType: string,
    currentPairs: { key: string; value: string }[]
  ) => {
    const data = currentPairs.reduce(
      (acc, pair) => {
        if (pair.key.trim()) {
          acc[pair.key.trim()] = pair.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

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

  const currentTypeDefinition = getSecretType(secretType);
  const isGeneric = secretType === "generic";

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Secret Type</Label>
          <Select
            value={secretType}
            onValueChange={(val) => {
              setSecretType(val);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {secretTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Secret Values</Label>
          {currentTypeDefinition && currentTypeDefinition.keys.length > 0 ? (
            // Predefined type with specific keys
            <div className="space-y-3">
              {currentTypeDefinition.keys.map((keyDef, index) => {
                const pair = pairs.find((p) => p.key === keyDef.name) || {
                  key: keyDef.name,
                  value: "",
                };
                const pairIndex = pairs.findIndex((p) => p.key === keyDef.name);
                return (
                  <div key={keyDef.name} className="space-y-1">
                    <Label>
                      {keyDef.label}
                      {keyDef.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      type={keyDef.isPassword ? "password" : "text"}
                      placeholder={keyDef.placeholder}
                      value={pair.value}
                      onChange={(e) =>
                        handlePairChange(
                          pairIndex >= 0 ? pairIndex : index,
                          "value",
                          e.target.value
                        )
                      }
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Generic type - user defines keys
            <>
              {pairs.map((pair, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Key name"
                      value={pair.key}
                      onChange={(e) =>
                        handlePairChange(index, "key", e.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex-1">
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
                  {isGeneric && pairs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePair(index)}
                      disabled={disabled}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {isGeneric && (
                <Button
                  onClick={addPair}
                  disabled={disabled}
                  type="button"
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Key-Value Pair
                </Button>
              )}
            </>
          )}

          {submitMode === "manual" && !hideSaveButton && (
            <Button
              onClick={manualSubmit}
              disabled={disabled}
              type="button"
              className="w-full"
            >
              Save Secret
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

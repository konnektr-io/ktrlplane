import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceSchemas } from "@/lib/resourceSchemas";
import type { CompassSettings } from "../../schemas/CompassSchema";

interface CompassFormProps {
  initialValues?: CompassSettings;
  onSubmit: (values: CompassSettings) => void;
  disabled?: boolean;
}

export function CompassForm({
  initialValues,
  onSubmit,
  disabled,
}: CompassFormProps) {
  const schema = resourceSchemas["Konnektr.Compass"];
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });
  // Use form, onSubmit, and disabled in the implementation to avoid unused variable warnings
  // Use form, onSubmit, and disabled to avoid unused variable warnings
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <button type="submit" disabled={disabled}>
        Save
      </button>
    </form>
  );
}

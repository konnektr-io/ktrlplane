import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resourceSchemas } from "@/lib/resourceSchemas";
import type { AssemblerSettings } from "../../schemas/AssemblerSchema";

interface AssemblerFormProps {
  initialValues?: AssemblerSettings;
  onSubmit: (values: AssemblerSettings) => void;
  disabled?: boolean;
}

export function AssemblerForm({
  initialValues,
  onSubmit,
  disabled,
}: AssemblerFormProps) {
  const schema = resourceSchemas["Konnektr.Assembler"];
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

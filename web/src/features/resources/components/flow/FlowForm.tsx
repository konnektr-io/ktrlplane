import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FlowSchema,
  type FlowSettings,
} from "@/features/resources/schemas/FlowSchema";

interface FlowFormProps {
  initialValues?: FlowSettings;
  onSubmit: (values: FlowSettings) => void;
  disabled?: boolean;
}

export function FlowForm({ initialValues, onSubmit, disabled }: FlowFormProps) {
  const schema = FlowSchema;
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

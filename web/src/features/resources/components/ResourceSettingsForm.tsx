import { ZodTypeAny, ZodObject, ZodNumber } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ResourceSettingsFormProps {
  schema: ZodTypeAny;
  initialValues: any;
  onSubmit: (values: any) => void;
  disabled?: boolean;
}

export function ResourceSettingsForm({ schema, initialValues, onSubmit, disabled }: ResourceSettingsFormProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Dynamically render fields based on schema shape (only for ZodObject)
  const fields = schema instanceof ZodObject ? Object.keys(schema.shape) : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field) => {
          // Detect if this field is a ZodNumber
          let isNumber = false;
          if (schema instanceof ZodObject) {
            isNumber = schema.shape[field] instanceof ZodNumber;
          }
          return (
            <FormField
              key={field}
              control={form.control}
              name={field}
              render={({ field: rhfField }) => (
                <FormItem>
                  <FormLabel>{field.charAt(0).toUpperCase() + field.slice(1)}</FormLabel>
                  <FormControl>
                    <Input
                      type={isNumber ? 'number' : 'text'}
                      value={rhfField.value ?? ''}
                      onChange={e => {
                        if (isNumber) {
                          // Convert to number, but allow empty string for clearing
                          const val = e.target.value;
                          rhfField.onChange(val === '' ? '' : Number(val));
                        } else {
                          rhfField.onChange(e);
                        }
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
        <Button type="submit" disabled={disabled || !form.formState.isDirty || !form.formState.isValid}>
          Save
        </Button>
      </form>
    </Form>
  );
}

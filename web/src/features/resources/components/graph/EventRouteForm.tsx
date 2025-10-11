import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Trash2, Plus } from 'lucide-react';


type Filter = {
  field: string;
  operator: string;
  value: string;
};

type EventRoute = {
  name: string;
  source: string;
  destination: string;
  enabled: boolean;
  filters: Filter[];
};

interface EventRouteFormProps {
  form: UseFormReturn<{ eventRoutes: EventRoute[] }>;
  routeIndex: number;
  onRemove: () => void;
  availableSinks: string[];
}

export function EventRouteForm({
  form,
  routeIndex,
  onRemove,
  availableSinks,
}: EventRouteFormProps) {
  const filters =
    (form.watch(`eventRoutes.${routeIndex}.filters`) as Filter[]) || [];

  const addFilter = () => {
    const currentFilters =
      (form.getValues(`eventRoutes.${routeIndex}.filters`) as Filter[]) || [];
    form.setValue(`eventRoutes.${routeIndex}.filters`, [
      ...currentFilters,
      { field: "", operator: "eq", value: "" },
    ]);
  };

  const removeFilter = (filterIndex: number) => {
    const currentFilters =
      (form.getValues(`eventRoutes.${routeIndex}.filters`) as Filter[]) || [];
    form.setValue(
      `eventRoutes.${routeIndex}.filters`,
      currentFilters.filter((_, i) => i !== filterIndex)
    );
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Event Route</CardTitle>
            <CardDescription>
              Configure routing and filtering for events
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route Name */}
        <FormField
          control={form.control}
          name={`eventRoutes.${routeIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., sensor-data-route" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Source */}
          <FormField
            control={form.control}
            name={`eventRoutes.${routeIndex}.source`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., sensors.temperature" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Destination */}
          <FormField
            control={form.control}
            name={`eventRoutes.${routeIndex}.destination`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination Sink *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination sink" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableSinks.map((sink) => (
                      <SelectItem key={sink} value={sink}>
                        {sink}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Enable/Disable Route */}
        <FormField
          control={form.control}
          name={`eventRoutes.${routeIndex}.enabled`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Route</FormLabel>
                <div className="text-sm text-muted-foreground">
                  When disabled, events will not be routed through this
                  configuration
                </div>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Event Filters</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFilter}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>

          {filters.map((_, filterIndex: number) => (
            <Card key={filterIndex} className="p-4">
              <div className="grid grid-cols-4 gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`eventRoutes.${routeIndex}.filters.${filterIndex}.field`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., temperature" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`eventRoutes.${routeIndex}.filters.${filterIndex}.operator`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="eq">Equals</SelectItem>
                          <SelectItem value="ne">Not Equals</SelectItem>
                          <SelectItem value="gt">Greater Than</SelectItem>
                          <SelectItem value="gte">
                            Greater Than or Equal
                          </SelectItem>
                          <SelectItem value="lt">Less Than</SelectItem>
                          <SelectItem value="lte">
                            Less Than or Equal
                          </SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="startsWith">
                            Starts With
                          </SelectItem>
                          <SelectItem value="endsWith">Ends With</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`eventRoutes.${routeIndex}.filters.${filterIndex}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="Filter value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFilter(filterIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {filters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              No filters configured. Events will be routed without filtering.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

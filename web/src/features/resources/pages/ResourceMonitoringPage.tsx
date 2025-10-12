import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { format, subHours } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Activity, Clock, Database, RefreshCw, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useRealtimeMetrics } from "../hooks/useObservability";
import { MetricsQueryParams } from "../services/observabilityService";

type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";
type MetricType = "cpu" | "memory" | "network" | "disk" | "custom";

interface MetricConfig {
  key: string;
  label: string;
  query: string;
  unit: string;
  color: string;
  type: "line" | "area";
}

const PREDEFINED_METRICS: Record<MetricType, MetricConfig[]> = {
  cpu: [
    {
      key: "cpu_usage",
      label: "CPU Usage",
      query: `rate(cpu_usage_seconds_total{resource_id="__RESOURCE_ID__"}[5m]) * 100`,
      unit: "%",
      color: "#8884d8",
      type: "area",
    },
  ],
  memory: [
    {
      key: "memory_usage",
      label: "Memory Usage",
      query: `memory_usage_bytes{resource_id="__RESOURCE_ID__"}`,
      unit: "bytes",
      color: "#82ca9d",
      type: "area",
    },
    {
      key: "memory_available",
      label: "Memory Available",
      query: `memory_available_bytes{resource_id="__RESOURCE_ID__"}`,
      unit: "bytes",
      color: "#ffc658",
      type: "line",
    },
  ],
  network: [
    {
      key: "network_rx",
      label: "Network RX",
      query: `rate(network_receive_bytes_total{resource_id="__RESOURCE_ID__"}[5m])`,
      unit: "bytes/s",
      color: "#ff7300",
      type: "line",
    },
    {
      key: "network_tx",
      label: "Network TX",
      query: `rate(network_transmit_bytes_total{resource_id="__RESOURCE_ID__"}[5m])`,
      unit: "bytes/s",
      color: "#387908",
      type: "line",
    },
  ],
  disk: [
    {
      key: "disk_usage",
      label: "Disk Usage",
      query: `disk_usage_bytes{resource_id="__RESOURCE_ID__"}`,
      unit: "bytes",
      color: "#8dd1e1",
      type: "area",
    },
    {
      key: "disk_iops",
      label: "Disk IOPS",
      query: `rate(disk_io_operations_total{resource_id="__RESOURCE_ID__"}[5m])`,
      unit: "ops/s",
      color: "#d084d0",
      type: "line",
    },
  ],
  custom: [],
};

const TIME_RANGE_CONFIGS: Record<TimeRange, { hours: number; step: string }> = {
  "1h": { hours: 1, step: "30s" },
  "6h": { hours: 6, step: "2m" },
  "24h": { hours: 24, step: "5m" },
  "7d": { hours: 168, step: "1h" },
  "30d": { hours: 720, step: "4h" },
};

export function ResourceMonitoringPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();

  const [selectedMetricType, setSelectedMetricType] =
    useState<MetricType>("cpu");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [customQuery, setCustomQuery] = useState("");
  const [isRealtime, setIsRealtime] = useState(true);

  // Calculate time range
  const { startTime, endTime, step } = useMemo(() => {
    const config = TIME_RANGE_CONFIGS[timeRange];
    const end = new Date();
    const start = subHours(end, config.hours);

    return {
      startTime: Math.floor(start.getTime() / 1000).toString(),
      endTime: Math.floor(end.getTime() / 1000).toString(),
      step: config.step,
    };
  }, [timeRange]);

  // Get current metrics to display
  const currentMetrics = useMemo(() => {
    if (selectedMetricType === "custom" && customQuery) {
      return [
        {
          key: "custom",
          label: "Custom Query",
          query: customQuery.replace("__RESOURCE_ID__", resourceId || ""),
          unit: "",
          color: "#8884d8",
          type: "line" as const,
        },
      ];
    }

    return PREDEFINED_METRICS[selectedMetricType].map((metric) => ({
      ...metric,
      query: metric.query.replace("__RESOURCE_ID__", resourceId || ""),
    }));
  }, [selectedMetricType, customQuery, resourceId]);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Format value based on unit
  const formatValue = (value: number, unit: string): string => {
    if (unit === "bytes") return formatBytes(value);
    if (unit === "bytes/s") return `${formatBytes(value)}/s`;
    if (unit === "%") return `${value.toFixed(2)}%`;
    if (unit === "ops/s") return `${value.toFixed(2)} ops/s`;
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring</h1>
          <p className="text-muted-foreground">
            View performance metrics and monitoring data for resource{" "}
            {resourceId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealtime(!isRealtime)}
            className="gap-2"
          >
            {isRealtime ? (
              <Activity className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {isRealtime ? "Live" : "Paused"}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Monitoring Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select
                value={timeRange}
                onValueChange={(value) => setTimeRange(value as TimeRange)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Metric Type</label>
              <Select
                value={selectedMetricType}
                onValueChange={(value) =>
                  setSelectedMetricType(value as MetricType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpu">CPU Metrics</SelectItem>
                  <SelectItem value="memory">Memory Metrics</SelectItem>
                  <SelectItem value="network">Network Metrics</SelectItem>
                  <SelectItem value="disk">Disk Metrics</SelectItem>
                  <SelectItem value="custom">Custom Query</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedMetricType === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Custom PromQL Query
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  placeholder={`cpu_usage{resource_id="__RESOURCE_ID__"}`}
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use __RESOURCE_ID__ as a placeholder for the current resource
                  ID
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Charts */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {currentMetrics.map((metric) => (
            <MetricChart
              key={metric.key}
              metric={metric}
              projectId={projectId}
              resourceId={resourceId}
              startTime={startTime}
              endTime={endTime}
              step={step}
              isRealtime={isRealtime}
              formatValue={formatValue}
            />
          ))}
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentMetrics.map((metric) => (
                  <MetricSummaryCard
                    key={metric.key}
                    metric={metric}
                    projectId={projectId}
                    resourceId={resourceId}
                    startTime={startTime}
                    endTime={endTime}
                    step={step}
                    formatValue={formatValue}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricChartProps {
  metric: MetricConfig;
  projectId?: string;
  resourceId?: string;
  startTime: string;
  endTime: string;
  step: string;
  isRealtime: boolean;
  formatValue: (value: number, unit: string) => string;
}

function MetricChart({
  metric,
  projectId,
  resourceId,
  startTime,
  endTime,
  step,
  isRealtime,
  formatValue,
}: MetricChartProps) {
  const queryParams: MetricsQueryParams = {
    query: metric.query,
    start: startTime,
    end: endTime,
    step,
  };

  const {
    data: metricData = [],
    isLoading,
    error,
    isFetching,
  } = useRealtimeMetrics(
    projectId,
    resourceId,
    queryParams,
    isRealtime ? 30000 : undefined // 30 seconds
  );

  const chartData = useMemo(() => {
    return metricData.map((point) => ({
      timestamp: point.timestamp * 1000,
      time: format(new Date(point.timestamp * 1000), "HH:mm:ss"),
      [metric.label]: point.value,
    }));
  }, [metricData, metric.label]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {metric.label}
            {isFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
          {isRealtime && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>
              Failed to load metric data: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available for the selected time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {metric.type === "area" ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatValue(value, metric.unit)}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatValue(value, metric.unit),
                    metric.label,
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={metric.label}
                  stroke={metric.color}
                  fill={metric.color}
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatValue(value, metric.unit)}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatValue(value, metric.unit),
                    metric.label,
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={metric.label}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricSummaryCardProps {
  metric: MetricConfig;
  projectId?: string;
  resourceId?: string;
  startTime: string;
  endTime: string;
  step: string;
  formatValue: (value: number, unit: string) => string;
}

function MetricSummaryCard({
  metric,
  projectId,
  resourceId,
  startTime,
  endTime,
  step,
  formatValue,
}: MetricSummaryCardProps) {
  const queryParams: MetricsQueryParams = {
    query: metric.query,
    start: startTime,
    end: endTime,
    step,
  };

  const { data: metricData = [], isLoading } = useRealtimeMetrics(
    projectId,
    resourceId,
    queryParams
  );

  const summary = useMemo(() => {
    if (metricData.length === 0) return null;

    const values = metricData.map((d) => d.value);
    const current = values[values.length - 1] || 0;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    return { current, min, max, avg };
  }, [metricData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            {metric.label}
          </h3>
          {summary ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {formatValue(summary.current, metric.unit)}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Min: {formatValue(summary.min, metric.unit)}</div>
                <div>Max: {formatValue(summary.max, metric.unit)}</div>
                <div>Avg: {formatValue(summary.avg, metric.unit)}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

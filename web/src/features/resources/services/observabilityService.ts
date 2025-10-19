import apiClient from "@/lib/axios";

// Types for log and metric responses
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  source?: string;
  labels?: Record<string, string>;
}

export interface LogResponse {
  status: string;
  data: {
    result: Array<{
      stream: Record<string, string>;
      values: Array<[string, string]>; // [timestamp, log_line]
    }>;
  };
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
}

export interface MetricResponse {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      values: Array<[number, string]>; // [timestamp, value]
    }>;
  };
}

export interface LogsQueryParams {
  query?: string;
  start?: string;
  end?: string;
  limit?: number;
}

export interface MetricsQueryParams {
  query: string;
  start: string;
  end: string;
  step?: string;
}

// Fetch logs from the backend proxy
export async function fetchLogs(
  projectId: string,
  resourceId: string,
  params: LogsQueryParams = {}
): Promise<LogEntry[]> {
  const queryParams = new URLSearchParams();

  // Set default values
  const query = params.query || '{job=~".+"}'; // Default to all jobs
  const limit = params.limit || 1000;
  const end = params.end || new Date().toISOString();
  const start =
    params.start || new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour

  queryParams.append("query", query);
  queryParams.append("start", start);
  queryParams.append("end", end);
  queryParams.append("limit", limit.toString());

  try {
    const response = await apiClient.get<LogResponse>(
      `/projects/${projectId}/resources/${resourceId}/logs?${queryParams.toString()}`
    );

    // Transform Loki response to our log entry format
    const logs: LogEntry[] = [];

    if (response.data?.data?.result) {
      for (const stream of response.data.data.result) {
        for (const [timestamp, message] of stream.values) {
          logs.push({
            // Loki returns timestamps in nanoseconds; convert to milliseconds for JavaScript Date
            timestamp: new Date(Math.floor(parseInt(timestamp) / 1_000_000)).toISOString(),
            level: stream.stream.level || "info",
            message: message,
            source: stream.stream.job || stream.stream.instance,
            labels: stream.stream,
          });
        }
      }
    }

    // Sort logs by timestamp (newest first)
    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    throw new Error(
      "Failed to fetch logs. Please check your connection and try again."
    );
  }
}

// Fetch metrics from the backend proxy
export async function fetchMetrics(
  projectId: string,
  resourceId: string,
  params: MetricsQueryParams
): Promise<MetricDataPoint[]> {
  const queryParams = new URLSearchParams();

  queryParams.append("query", params.query);
  queryParams.append("start", params.start);
  queryParams.append("end", params.end);
  queryParams.append("step", params.step || "15s");

  try {
    const response = await apiClient.get<MetricResponse>(
      `/projects/${projectId}/resources/${resourceId}/metrics/query_range?${queryParams.toString()}`
    );

    // Transform Prometheus response to our metric data point format
    const dataPoints: MetricDataPoint[] = [];

    if (response.data?.data?.result) {
      for (const series of response.data.data.result) {
        for (const [timestamp, value] of series.values) {
          dataPoints.push({
            timestamp: timestamp * 1000, // Convert to milliseconds
            value: parseFloat(value),
          });
        }
      }
    }

    // Sort by timestamp
    return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    throw new Error(
      "Failed to fetch metrics. Please check your connection and try again."
    );
  }
}

// Predefined log queries for common use cases
export const LOG_QUERIES = {
  all: '{job=~".+"}',
  errors: '{level="error"}',
  warnings: '{level=~"warn|warning"}',
  application: '{job="application"}',
  nginx: '{job="nginx"}',
  database: '{job=~".*database.*|.*db.*|.*sql.*"}',
} as const;

// Predefined metric queries for common use cases
export const METRIC_QUERIES = {
  cpu: "cpu_usage_percent",
  memory: "memory_usage_percent",
  disk: "disk_usage_percent",
  network_in: "network_receive_bytes_per_sec",
  network_out: "network_transmit_bytes_per_sec",
  requests_per_second: "http_requests_per_second",
  response_time: "http_response_time_seconds",
  error_rate: "http_error_rate_percent",
} as const;

import { useQuery } from "@tanstack/react-query";
import {
  fetchLogs,
  fetchMetrics,
  LogEntry,
  MetricDataPoint,
  LogsQueryParams,
  MetricsQueryParams,
} from "../services/observabilityService";

// Hook for fetching logs
export function useLogs(
  projectId: string | undefined,
  resourceId: string | undefined,
  params: LogsQueryParams = {},
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery<LogEntry[], Error>({
    queryKey: ["logs", projectId, resourceId, params],
    queryFn: () => {
      if (!projectId || !resourceId) {
        throw new Error("Project ID and Resource ID are required");
      }
      return fetchLogs(projectId, resourceId, params);
    },
    enabled: Boolean(projectId && resourceId) && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  });
}

// Hook for fetching metrics
export function useMetrics(
  projectId: string | undefined,
  resourceId: string | undefined,
  params: MetricsQueryParams,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  return useQuery<MetricDataPoint[], Error>({
    queryKey: ["metrics", projectId, resourceId, params],
    queryFn: () => {
      if (!projectId || !resourceId) {
        throw new Error("Project ID and Resource ID are required");
      }
      return fetchMetrics(projectId, resourceId, params);
    },
    enabled:
      Boolean(projectId && resourceId && params.query) &&
      (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
  });
}

// Hook for real-time logs (with auto-refresh)
export function useRealtimeLogs(
  projectId: string | undefined,
  resourceId: string | undefined,
  params: LogsQueryParams = {},
  refreshInterval: number = 5000 // 5 seconds
) {
  return useLogs(projectId, resourceId, params, {
    refetchInterval: refreshInterval,
  });
}

// Hook for real-time metrics (with auto-refresh)
export function useRealtimeMetrics(
  projectId: string | undefined,
  resourceId: string | undefined,
  params: MetricsQueryParams,
  refreshInterval: number = 15000 // 15 seconds
) {
  return useMetrics(projectId, resourceId, params, {
    refetchInterval: refreshInterval,
  });
}

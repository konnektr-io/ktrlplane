import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, Pause, Play, RefreshCw, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { useRealtimeLogs } from "../hooks/useObservability";
import { LogEntry, LogsQueryParams } from "../services/observabilityService";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "bg-slate-500",
  info: "bg-blue-500",
  warn: "bg-yellow-500",
  error: "bg-red-500",
};

const columnHelper = createColumnHelper<LogEntry>();

export function ResourceLogsPage() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();

  // Query state
  const [searchQuery, setSearchQuery] = useState("");
  const [logLevel, setLogLevel] = useState<LogLevel | "all">("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isRealtime, setIsRealtime] = useState(true);
  const [limit, setLimit] = useState(1000);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Build query params
  const queryParams = useMemo((): LogsQueryParams => {
    const params: LogsQueryParams = {
      limit,
    };

    // Build LogQL query
    let query = '{resource_id="' + resourceId + '"}';

    if (logLevel !== "all") {
      query += ` |= "${logLevel}"`;
    }

    if (searchQuery) {
      query += ` |~ "${searchQuery}"`;
    }

    params.query = query;

    // Add time range
    if (startDate) {
      params.start = Math.floor(startDate.getTime() / 1000).toString();
    }
    if (endDate) {
      params.end = Math.floor(endDate.getTime() / 1000).toString();
    }

    return params;
  }, [resourceId, searchQuery, logLevel, startDate, endDate, limit]);

  // Fetch logs
  const {
    data: logs = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useRealtimeLogs(
    projectId,
    resourceId,
    queryParams,
    isRealtime ? 5000 : undefined
  );

  // Define table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("timestamp", {
        header: "Timestamp",
        cell: (info) => (
          <div className="text-sm font-mono">
            {format(new Date(info.getValue()), "yyyy-MM-dd HH:mm:ss.SSS")}
          </div>
        ),
        size: 180,
      }),
      columnHelper.accessor("level", {
        header: "Level",
        cell: (info) => {
          const level = info.getValue() as LogLevel;
          return (
            <Badge
              variant="secondary"
              className={`text-white ${
                LOG_LEVEL_COLORS[level] || "bg-gray-500"
              }`}
            >
              {level?.toUpperCase() || "UNKNOWN"}
            </Badge>
          );
        },
        size: 80,
      }),
      columnHelper.accessor("source", {
        header: "Source",
        cell: (info) => (
          <div className="text-sm text-muted-foreground font-mono">
            {info.getValue() || "-"}
          </div>
        ),
        size: 150,
      }),
      columnHelper.accessor("message", {
        header: "Message",
        cell: (info) => (
          <div className="text-sm break-words max-w-md">{info.getValue()}</div>
        ),
      }),
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data: logs,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleExportLogs = () => {
    const csv = [
      ["Timestamp", "Level", "Source", "Message"],
      ...logs.map((log) => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss.SSS"),
        log.level || "unknown",
        log.source || "-",
        log.message,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${resourceId}-${format(
      new Date(),
      "yyyy-MM-dd-HH-mm-ss"
    )}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSetQuickTimeRange = (hours: number) => {
    const now = new Date();
    setEndDate(now);
    setStartDate(new Date(now.getTime() - hours * 60 * 60 * 1000));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs</h1>
          <p className="text-muted-foreground">
            View and analyze logs for resource {resourceId}
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
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRealtime ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Query Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Query Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Log Level</label>
              <Select
                value={logLevel}
                onValueChange={(value) =>
                  setLogLevel(value as LogLevel | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 logs</SelectItem>
                  <SelectItem value="500">500 logs</SelectItem>
                  <SelectItem value="1000">1000 logs</SelectItem>
                  <SelectItem value="5000">5000 logs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Time Range</label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetQuickTimeRange(1)}
                  className="text-xs"
                >
                  1h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetQuickTimeRange(6)}
                  className="text-xs"
                >
                  6h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetQuickTimeRange(24)}
                  className="text-xs"
                >
                  24h
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="datetime-local"
                value={startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm") : ""}
                onChange={(e) =>
                  setStartDate(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="datetime-local"
                value={endDate ? format(endDate, "yyyy-MM-dd'T'HH:mm") : ""}
                onChange={(e) =>
                  setEndDate(
                    e.target.value ? new Date(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Logs ({logs.length})
              {isFetching && (
                <RefreshCw className="ml-2 h-4 w-4 animate-spin inline" />
              )}
            </CardTitle>
            {isRealtime && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>
                Failed to load logs: {error.message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? "cursor-pointer select-none"
                                  : ""
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: " ↑",
                                desc: " ↓",
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

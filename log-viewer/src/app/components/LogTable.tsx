
"use client";
import { LogEntry } from "../lib/useLogs";
import { cn } from "tailwind-merge";
import { AlertTriangle, Bug, CircleAlert, Info, XOctagon, ShieldAlert } from "lucide-react";

function severityIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "error":
      return <XOctagon className="text-destructive" size={16} />;
    case "warning":
      return <AlertTriangle className="text-warning" size={16} />;
    case "debug":
      return <Bug className="text-muted-foreground" size={16} />;
    case "critical":
      return <ShieldAlert className="text-critical" size={16} />;
    default:
      return <Info size={16} />;
  }
}

export default function LogTable({
  logs,
  selected,
  onSelect,
}: {
  logs: LogEntry[];
  selected: LogEntry | null;
  onSelect: (l: LogEntry) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-background text-xs uppercase">
        <tr className="text-left">
          <th className="py-1 px-2">Time</th>
          <th className="py-1 px-2">Source</th>
          <th className="py-1 px-2">Type</th>
          <th className="py-1 px-2">Message</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr
            key={log.timestamp + log.source}
            onClick={() => onSelect(log)}
            className={cn(
              "cursor-pointer hover:bg-accent/20 border-b last:border-none",
              selected === log && "bg-accent/40"
            )}
          >
            <td className="py-1 px-2 whitespace-nowrap">
              {new Date(log.timestamp).toLocaleTimeString()}
            </td>
            <td className="py-1 px-2 font-medium">{log.source}</td>
            <td className="py-1 px-2 flex items-center gap-1">
              {severityIcon(log.event_type)}
              {log.event_type}
            </td>
            <td className="py-1 px-2 truncate max-w-[400px]">{log.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

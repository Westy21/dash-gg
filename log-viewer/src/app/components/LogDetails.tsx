
"use client";
import { LogEntry } from "../lib/useLogs";

export default function LogDetails({ log }: { log: LogEntry | null }) {
  if (!log)
    return <p className="text-sm text-muted-foreground">Select a row to view details</p>;

  return (
    <div className="space-y-1 text-sm">
      <h2 className="font-semibold text-base mb-2">Entry Details</h2>
      <p>
        <span className="font-medium">Time:</span> {new Date(log.timestamp).toLocaleString()}
      </p>
      <p>
        <span className="font-medium">Source:</span> {log.source}
      </p>
      <p>
        <span className="font-medium">Type:</span> {log.event_type}
      </p>
      <p>
        <span className="font-medium">Message:</span> {log.message}
      </p>
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div className="pt-2">
          <span className="font-medium">Metadata:</span>
          <pre className="bg-muted rounded p-2 mt-1 text-xs whitespace-pre-wrap">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useMemo } from "react";

export interface LogEntry {
  timestamp: string;
  source: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown>;
}

export default function useLogs(apiUrl: string, pollMs = 5000) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fetchLogs = async () => {
      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(res.statusText);
        const data: LogEntry[] = await res.json();
        setLogs(data.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)));
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchLogs();
    timer = setInterval(fetchLogs, pollMs);
    return () => clearInterval(timer);
  }, [apiUrl, pollMs]);

  // histogram buckets per minute (last 10m)
  const histogram = useMemo(() => {
    const now = Date.now();
    const buckets: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
      const t = new Date(now - i * 60_000);
      const label = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      buckets[label] = 0;
    }
    logs.forEach((log) => {
      const date = new Date(log.timestamp);
      const diffMin = Math.floor((now - +date) / 60_000);
      if (diffMin < 10) {
        const label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        buckets[label] = (buckets[label] || 0) + 1;
      }
    });
    return Object.entries(buckets)
      .reverse()
      .map(([t, count]) => ({ t, count }));
  }, [logs]);

  return { logs, error, histogram };
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  X as XIcon,
  Search as SearchIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * Shape of one log entry coming from the FastAPI endpoint
 */
export type LogEntry = {
  timestamp: string;
  source: string;
  event_type: string;
  message: string;
  // any additional dynamic attributes (e.g. "log_type") will be present
  [extra: string]: unknown;
};

export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(true);

  /** FETCH & POLL *******************************************************/
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/activity");
        if (!res.ok) throw new Error(res.statusText);
        // newest‑first ordering assumed; reverse if backend changes
        const data: LogEntry[] = (await res.json()).reverse();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    fetchLogs();
    const id = setInterval(fetchLogs, 5_000);
    return () => clearInterval(id);
  }, []);

  /*********************** DYNAMIC ATTRIBUTE DISCOVERY *******************/
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    logs.forEach((l) => {
      Object.keys(l).forEach((k) => {
        if (k === "message" || k === "metadata") return; // exclude message body & nested metadata
        keys.add(k);
      });
    });
    return Array.from(keys);
  }, [logs]);

  /** All unique values for each attribute – used to render checkbox lists */
  const attributeOptions = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    attributeKeys.forEach((k) => (map[k] = new Set()));
    logs.forEach((l) => {
      attributeKeys.forEach((k) => {
        map[k].add(String(l[k] ?? "<undefined>"));
      });
    });
    return map as Record<string, Set<string>>;
  }, [logs, attributeKeys]);

  /************************ FILTER / SEARCH / SORT **********************/
  const filteredLogs = useMemo(() => {
    let data = logs;

    // Apply attribute filters
    data = data.filter((l) => {
      for (const [k, values] of Object.entries(filters)) {
        if (values.size === 0) continue;
        if (!values.has(String(l[k] ?? "<undefined>"))) return false;
      }
      return true;
    });

    // Apply search
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter((l) => l.message.toLowerCase().includes(s));
    }

    // Sort
    data = data.slice().sort((a, b) => {
      const tA = new Date(a.timestamp).getTime();
      const tB = new Date(b.timestamp).getTime();
      return sortDesc ? tB - tA : tA - tB;
    });

    return data;
  }, [logs, filters, search, sortDesc]);

  /** Histogram of filtered logs (per minute) */
  const histogramData = useMemo(() => {
    const buckets = new Map<string, number>();
    filteredLogs.forEach((log) => {
      const key = log.timestamp.slice(0, 16); // YYYY‑MM‑DDTHH:MM
      buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets, ([minute, count]) => ({ minute, count })).sort(
      (a, b) => a.minute.localeCompare(b.minute)
    );
  }, [filteredLogs]);

  /***************************** HELPERS ********************************/
  const toggleFilterValue = (key: string, value: string) => {
    setFilters((prev) => {
      const copy: Record<string, Set<string>> = {};
      Object.entries(prev).forEach(([k, v]) => (copy[k] = new Set(v)));
      const set = copy[key] ?? new Set<string>();
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete copy[key];
      else copy[key] = set;
      return copy;
    });
  };

  const clearFilter = (key: string, value?: string) => {
    setFilters((prev) => {
      const copy: Record<string, Set<string>> = {};
      Object.entries(prev).forEach(([k, v]) => (copy[k] = new Set(v)));
      if (value === undefined) {
        delete copy[key];
      } else {
        const set = copy[key];
        set?.delete(value);
        if (set && set.size === 0) delete copy[key];
      }
      return copy;
    });
  };

  const colourFor = (entry: LogEntry) => {
    const et = String(entry.event_type).toLowerCase();
    if (et.includes("critical") || et.includes("alert")) return "border-l-red-600";
    if (et.includes("error") || et.includes("fail")) return "border-l-orange-500";
    if (et.includes("warn")) return "border-l-yellow-400";
    if (et.includes("debug")) return "border-l-green-600";
    return "border-l-gray-400";
  };

  /******************************* JSX *********************************/
  return (
    <main className="h-screen w-full p-4 flex flex-col gap-4 bg-background text-foreground">
      {/********************* Top bar (search & sort) *******************/}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2 py-2 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <button
          onClick={() => setSortDesc((p) => !p)}
          className="flex items-center gap-1 border rounded-lg px-3 py-2 bg-card text-sm hover:bg-muted"
        >
          {sortDesc ? (
            <>
              <ChevronDown className="h-4 w-4" /> Newest
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" /> Oldest
            </>
          )}
        </button>
      </div>

      {/*********************** Histogram ******************************/}
      <section className="h-36 border rounded-lg bg-card">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogramData} barGap={2} barCategoryGap={1}>
            <XAxis dataKey="minute" hide />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/*********** Main content area: sidebar + list + details ********/}
      <section className="flex flex-1 gap-4 overflow-hidden">
        {/******************* Dynamic filter sidebar ****************/}
        <aside className="w-60 shrink-0 overflow-y-auto rounded-lg border bg-card p-2 flex flex-col gap-2">
          <h3 className="text-sm font-semibold px-2">Filters</h3>
          {attributeKeys.map((key) => (
            <details key={key} className="border rounded-lg">
              <summary className="cursor-pointer px-2 py-1 text-sm font-medium capitalize select-none">
                {key.replace(/_/g, " ")}
              </summary>
              <div className="px-2 py-1 flex flex-col gap-1 text-xs">
                {Array.from(attributeOptions[key])
                  .sort()
                  .map((value) => {
                    const checked = filters[key]?.has(value) ?? false;
                    return (
                      <label key={value} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFilterValue(key, value)}
                          className="accent-primary"
                        />
                        <span className="truncate" title={value}>
                          {value}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </details>
          ))}
        </aside>

        {/*********************** Log list *************************/}
        <div className="flex-1 overflow-y-auto rounded-lg border bg-card">
          {/* Applied filter chips */}
          {Object.keys(filters).length > 0 && (
            <div className="flex flex-wrap gap-1 p-2 text-xs">
              {Object.entries(filters).flatMap(([k, set]) =>
                Array.from(set).map((v) => (
                  <button
                    key={`${k}:${v}`}
                    onClick={() => clearFilter(k, v)}
                    className="flex items-center gap-1 border rounded-full px-2 py-0.5 bg-muted hover:bg-muted/70"
                  >
                    <span className="capitalize">{k}:</span>
                    <span>{v}</span>
                    <XIcon className="h-3 w-3" />
                  </button>
                ))
              )}
              <button
                onClick={() => setFilters({})}
                className="ml-auto text-[10px] text-muted-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* List */}
          {filteredLogs.map((log, i) => (
            <button
              key={i}
              onClick={() => setSelected(log)}
              className={`w-full flex items-center gap-2 border-b px-4 py-2 text-left hover:bg-muted ${colourFor(
                log
              )}`}
            >
              <span className="text-xs w-24 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-medium truncate flex-1 text-sm">
                {log.message}
              </span>
            </button>
          ))}
          {filteredLogs.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">
              No logs match current filters.
            </p>
          )}
        </div>

        {/***************** Details panel (toggleable) **************/}
        {selected && (
          <div className="relative w-80 shrink-0 rounded-lg border p-4 bg-card text-sm overflow-y-auto">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
            >
              <XIcon className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold mb-2">Entry Details</h2>
            <p>
              <span className="font-medium">Time:</span>{" "}
              {new Date(selected.timestamp).toLocaleString()}
            </p>
            {attributeKeys.map((k) => (
              <p key={k}>
                <span className="font-medium capitalize">{k}:</span> {String(selected[k])}
              </p>
            ))}
            <p className="mt-2 whitespace-pre-wrap break-words">
              <span className="font-medium">Message:</span> {selected.message}
            </p>
            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <>
                <h3 className="font-semibold mt-3 mb-1">Metadata</h3>
                <pre className="bg-muted rounded p-2 text-xs whitespace-pre-wrap">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

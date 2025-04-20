"use client";
import { useState } from "react";
import useLogs, { LogEntry } from "../lib/useLogs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import LogHistogram from "./LogHistogram";
import LogTable from "./LogTable";
import LogDetails from "./LogDetails";

export default function LogViewer({ apiUrl }: { apiUrl: string }) {
  const { logs, error, histogram } = useLogs(apiUrl);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const filtered = logs.filter(
    (l) =>
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.event_type.toLowerCase().includes(search.toLowerCase()) ||
      l.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex-none">
        <h1 className="text-xl font-semibold mb-2">Log Viewer – Last 10 minutes</h1>
        <LogHistogram data={histogram} />
      </div>
      <div className="flex gap-4 flex-1 overflow-hidden">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-0 flex flex-col h-full">
            <div className="p-2 border-b flex gap-2 items-center">
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {error && <span className="text-destructive text-sm">{error}</span>}
            </div>
            <ScrollArea className="flex-1">
              <LogTable logs={filtered} onSelect={setSelected} selected={selected} />
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="w-80 flex-none">
          <CardContent className="p-4 h-full">
            <LogDetails log={selected} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

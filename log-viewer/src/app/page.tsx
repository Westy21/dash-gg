"use client";
import LogViewer from "../components/LogViewer";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-muted text-foreground">
      <LogViewer apiUrl="http://localhost:8000/activity" />
    </main>
  );
}

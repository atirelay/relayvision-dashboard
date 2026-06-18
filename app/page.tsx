"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const modules = [
  "Dashboard",
  "Workflow Runs",
  "Workflow Manager",
  "Devices",
  "Users",
  "Models",
  "Reports",
  "Settings",
];

export default function Home() {
  const [runs, setRuns] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState("Dashboard");

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error) {
      setRuns(data || []);
    }
  }

  const totalRuns = runs.length;
  const totalCoaching = runs.reduce((sum, run) => sum + (run.coaching_events || 0), 0);
  const totalMissing = runs.reduce((sum, run) => sum + (run.missing_events || 0), 0);
  const avgTime =
    runs.length > 0
      ? Math.round(runs.reduce((sum, run) => sum + (run.total_time || 0), 0) / runs.length)
      : 0;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white flex">
      <aside className="w-72 bg-[#0F1720] border-r border-white/10 flex flex-col">
      <div className="p-2 border-b border-white/10">
        <Image
          src="/relayvision_sidebar_header.png"
          alt="RelayVision"
          width={1200}
          height={300}
          priority
          className="w-full h-auto object-contain"
        />
      </div>

        <nav className="p-4 space-y-1">
          {modules.map((module) => (
            <button
              key={module}
              onClick={() => setActiveModule(module)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeModule === module
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {module}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 border-t border-white/10 text-xs text-zinc-500">
          RelayVision Cloud v0.1
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <header className="h-20 border-b border-white/10 bg-[#0B0F14] flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-semibold">{activeModule}</h1>
            <p className="text-sm text-zinc-400">
              Monitor workflow performance, coaching events, devices, and operators.
            </p>
          </div>

          <div className="text-sm text-zinc-400">
            app.relayvision.ai
          </div>
        </header>

        <div className="p-8">
          {activeModule === "Dashboard" && (
            <>
              <div className="grid grid-cols-4 gap-5 mb-8">
                <MetricCard label="Total Runs" value={totalRuns.toString()} />
                <MetricCard label="Average Time" value={`${avgTime}s`} />
                <MetricCard label="Coaching Events" value={totalCoaching.toString()} />
                <MetricCard label="Missing Events" value={totalMissing.toString()} />
              </div>

              <Panel title="Recent Workflow Runs">
                <RunsTable runs={runs.slice(0, 10)} />
              </Panel>
            </>
          )}

          {activeModule === "Workflow Runs" && (
            <Panel title="Workflow Run History">
              <RunsTable runs={runs} />
            </Panel>
          )}

          {activeModule !== "Dashboard" && activeModule !== "Workflow Runs" && (
            <PlaceholderModule title={activeModule} />
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-6 shadow-sm">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-3xl font-bold mt-3">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function RunsTable({ runs }: { runs: any[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-zinc-400 border-b border-white/10">
          <th className="py-3">Workflow</th>
          <th>Industry</th>
          <th>Operator</th>
          <th>Total Time</th>
          <th>Coaching</th>
          <th>Missing</th>
          <th>Timestamp</th>
        </tr>
      </thead>

      <tbody>
        {runs.map((run) => (
          <tr key={run.id} className="border-b border-white/5 hover:bg-white/[0.03]">
            <td className="py-4 font-medium">{run.workflow_name}</td>
            <td className="text-zinc-300">{run.industry || "General"}</td>
            <td className="text-zinc-300">{run.operator_name || "Unknown"}</td>
            <td>{run.total_time}s</td>
            <td>{run.coaching_events}</td>
            <td>{run.missing_events}</td>
            <td className="text-zinc-400">
              {run.timestamp ? new Date(run.timestamp).toLocaleString() : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlaceholderModule({ title }: { title: string }) {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-10">
      <h2 className="text-2xl font-semibold mb-3">{title}</h2>
      <p className="text-zinc-400 max-w-2xl">
        This module is part of the RelayVision platform roadmap. It will support
        enterprise workflow intelligence across users, devices, models, reports,
        workflow management, and system settings.
      </p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [runs, setRuns] = useState<any[]>([]);

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

  const totalCoaching = runs.reduce(
    (sum, run) => sum + (run.coaching_events || 0),
    0
  );

  const totalMissing = runs.reduce(
    (sum, run) => sum + (run.missing_events || 0),
    0
  );

  const avgTime =
    runs.length > 0
      ? Math.round(
          runs.reduce(
            (sum, run) => sum + (run.total_time || 0),
            0
          ) / runs.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        RelayVision Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="bg-zinc-900 p-6 rounded-xl">
          <div className="text-zinc-400">Total Runs</div>
          <div className="text-3xl font-bold">
            {totalRuns}
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <div className="text-zinc-400">Avg Time</div>
          <div className="text-3xl font-bold">
            {avgTime}s
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <div className="text-zinc-400">Coaching Events</div>
          <div className="text-3xl font-bold">
            {totalCoaching}
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl">
          <div className="text-zinc-400">Missing Events</div>
          <div className="text-3xl font-bold">
            {totalMissing}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          Recent Workflow Runs
        </h2>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-zinc-700">
              <th className="py-2">Workflow</th>
              <th>Operator</th>
              <th>Total Time</th>
              <th>Coaching</th>
              <th>Missing</th>
            </tr>
          </thead>

          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className="border-b border-zinc-800"
              >
                <td className="py-3">
                  {run.workflow_name}
                </td>
                <td>{run.operator_name}</td>
                <td>{run.total_time}s</td>
                <td>{run.coaching_events}</td>
                <td>{run.missing_events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
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
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [selectedRun, setSelectedRun] = useState<any | null>(null);

  const [workflowName, setWorkflowName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [steps, setSteps] = useState<string[]>([""]);

  useEffect(() => {
    loadRuns();
    loadWorkflows();
  }, []);

  async function loadRuns() {
    const { data, error } = await supabase
      .from("workflow_runs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error) setRuns(data || []);
  }

  async function loadWorkflows() {
    const { data, error } = await supabase
      .from("workflow_definitions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setWorkflows(data || []);
  }

  async function saveWorkflow() {
    const cleanSteps = steps
      .map((step) => step.trim())
      .filter((step) => step !== "");

    if (!workflowName.trim()) {
      alert("Workflow name is required.");
      return;
    }

    if (cleanSteps.length === 0) {
      alert("At least one workflow step is required.");
      return;
    }

    const { error } = await supabase.from("workflow_definitions").insert([
      {
        workflow_name: workflowName,
        industry: industry || "General",
        description: description || "No description provided.",
        version: version || "1.0",
        steps: cleanSteps,
      },
    ]);

    if (error) {
      alert("Error saving workflow.");
      console.error(error);
      return;
    }

    alert("Workflow saved successfully.");

    setWorkflowName("");
    setIndustry("");
    setDescription("");
    setVersion("1.0");
    setSteps([""]);

    loadWorkflows();
  }

  function updateStep(index: number, value: string) {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  }

  function addStep() {
    setSteps([...steps, ""]);
  }

  function removeStep(index: number) {
    const updated = steps.filter((_, i) => i !== index);
    setSteps(updated.length > 0 ? updated : [""]);
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
          runs.reduce((sum, run) => sum + (run.total_time || 0), 0) /
            runs.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#0B0F14] text-white flex">
      <aside className="w-80 bg-[#0F1720] border-r border-white/10 flex flex-col">
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
              onClick={() => {
                setActiveModule(module);
                setSelectedRun(null);
              }}
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
              Monitor workflow performance, devices, users, models, and reports.
            </p>
          </div>

          <div className="text-sm text-zinc-400">app.relayvision.ai</div>
        </header>

        <div className="p-8">
          {activeModule === "Dashboard" && (
            <>
              <div className="grid grid-cols-4 gap-5 mb-8">
                <MetricCard label="Total Runs" value={totalRuns.toString()} />
                <MetricCard label="Average Time" value={`${avgTime}s`} />
                <MetricCard
                  label="Coaching Events"
                  value={totalCoaching.toString()}
                />
                <MetricCard
                  label="Missing Events"
                  value={totalMissing.toString()}
                />
              </div>

              <Panel title="Recent Workflow Runs">
                <RunsTable
                  runs={runs.slice(0, 10)}
                  onSelectRun={setSelectedRun}
                />
              </Panel>
            </>
          )}

          {activeModule === "Workflow Runs" && (
            <Panel title="Workflow Run History">
              <RunsTable runs={runs} onSelectRun={setSelectedRun} />
            </Panel>
          )}

          {activeModule === "Workflow Manager" && (
            <WorkflowManager
              workflows={workflows}
              workflowName={workflowName}
              setWorkflowName={setWorkflowName}
              industry={industry}
              setIndustry={setIndustry}
              description={description}
              setDescription={setDescription}
              version={version}
              setVersion={setVersion}
              steps={steps}
              updateStep={updateStep}
              addStep={addStep}
              removeStep={removeStep}
              saveWorkflow={saveWorkflow}
            />
          )}

          {activeModule !== "Dashboard" &&
            activeModule !== "Workflow Runs" &&
            activeModule !== "Workflow Manager" && (
              <PlaceholderModule title={activeModule} />
            )}
        </div>
      </section>

      {selectedRun && (
        <RunDetailPanel run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function RunsTable({
  runs,
  onSelectRun,
}: {
  runs: any[];
  onSelectRun: (run: any) => void;
}) {
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
          <tr
            key={run.id}
            onClick={() => onSelectRun(run)}
            className="border-b border-white/5 hover:bg-white/[0.05] cursor-pointer transition"
          >
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

function WorkflowManager({
  workflows,
  workflowName,
  setWorkflowName,
  industry,
  setIndustry,
  description,
  setDescription,
  version,
  setVersion,
  steps,
  updateStep,
  addStep,
  removeStep,
  saveWorkflow,
}: any) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-[#111827] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">Create Workflow</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Build cloud-managed workflow definitions for RelayVision edge devices.
        </p>

        <div className="space-y-4">
          <input
            className="w-full bg-[#0F1720] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full bg-[#0F1720] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
              placeholder="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />

            <input
              className="w-full bg-[#0F1720] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
              placeholder="Version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <textarea
            className="w-full bg-[#0F1720] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
            rows={3}
            placeholder="Workflow Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-medium">Workflow Steps</h3>
                <p className="text-xs text-zinc-400">
                  Each step becomes part of the workflow definition.
                </p>
              </div>

              <button
                onClick={addStep}
                className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm"
              >
                + Add Step
              </button>
            </div>

            <div className="p-4 space-y-3">
              {steps.map((step: string, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>

                  <input
                    className="flex-1 bg-[#0F1720] border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-blue-500"
                    placeholder={`Step ${index + 1}`}
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                  />

                  <button
                    onClick={() => removeStep(index)}
                    className="text-zinc-400 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveWorkflow}
            className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-medium"
          >
            Save Workflow
          </button>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-1">Existing Workflows</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Cloud workflow definitions saved in Supabase.
        </p>

        <div className="space-y-3">
          {workflows.length === 0 && (
            <div className="text-sm text-zinc-500 border border-white/10 rounded-lg p-4">
              No workflows created yet.
            </div>
          )}

          {workflows.map((workflow: any) => (
            <div
              key={workflow.id}
              className="border border-white/10 rounded-lg p-4 hover:bg-white/[0.03]"
            >
              <div className="font-medium">{workflow.workflow_name}</div>
              <div className="text-sm text-zinc-400 mt-1">
                {workflow.industry || "General"} • Version{" "}
                {workflow.version || "1.0"}
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                {Array.isArray(workflow.steps)
                  ? `${workflow.steps.length} steps`
                  : "0 steps"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RunDetailPanel({
  run,
  onClose,
}: {
  run: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0F1720] border-l border-white/10 shadow-2xl z-50">
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-6">
        <div>
          <h2 className="text-lg font-semibold">Workflow Run Details</h2>
          <p className="text-xs text-zinc-400">Run ID: {run.id}</p>
        </div>

        <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">
          Close
        </button>
      </div>

      <div className="p-6 space-y-5">
        <DetailBlock label="Workflow" value={run.workflow_name} />
        <DetailBlock label="Industry" value={run.industry || "General"} />
        <DetailBlock
          label="Description"
          value={run.description || "No description provided."}
        />
        <DetailBlock label="Version" value={run.version || "1.0"} />
        <DetailBlock label="Operator" value={run.operator_name || "Unknown"} />
        <DetailBlock label="Device" value={run.device_name || "Unknown"} />
        <DetailBlock label="Total Time" value={`${run.total_time || 0} seconds`} />
        <DetailBlock
          label="Coaching Events"
          value={`${run.coaching_events || 0}`}
        />
        <DetailBlock
          label="Missing Events"
          value={`${run.missing_events || 0}`}
        />
        <DetailBlock
          label="Timestamp"
          value={run.timestamp ? new Date(run.timestamp).toLocaleString() : "-"}
        />

        <div className="pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold mb-2">Run Summary</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            RelayVision verified this workflow run and synchronized the result
            to the cloud dashboard. Future versions will include step-by-step
            timing, PDF reports, screenshots, evidence images, and action
            recognition results.
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
        {label}
      </div>
      <div className="text-sm text-white">{value}</div>
    </div>
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
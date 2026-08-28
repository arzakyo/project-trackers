import React, { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useRealtime, useRealtimeChannel } from "../realtime/react-context";
import { RealtimeMessage } from "../realtime/types";

interface TrackerTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
}

export const Route = createFileRoute("/")({
  component: DashboardComponent,
});

export function DashboardComponent() {
  const { driverName, publish } = useRealtime();
  const [tasks, setTasks] = useState<TrackerTask[]>([
    { id: "1", title: "Setup TanStack Start + Vinxi", status: "done", priority: "high" },
    { id: "2", title: "Integrate Better Auth & Prisma DB", status: "in_progress", priority: "high" },
    { id: "3", title: "Build Cloudflare DO Realtime Proxy", status: "todo", priority: "medium" },
  ]);

  const [logs, setLogs] = useState<Array<{ id: string; text: string; time: string }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Realtime message listener for topic 'project:trackers'
  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        text: `[${message.event}] ${JSON.stringify(message.payload)}`,
        time: timestamp,
      },
      ...prev.slice(0, 19),
    ]);

    if (message.event === "TASK_ADDED" && message.payload) {
      const task = message.payload as TrackerTask;
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
    } else if (message.event === "TASK_TOGGLED" && message.payload) {
      const payload = message.payload as { id: string; status: TrackerTask["status"] };
      setTasks((prev) =>
        prev.map((t) => (t.id === payload.id ? { ...t, status: payload.status } : t))
      );
    }
  }, []);

  useRealtimeChannel("project:trackers", handleRealtimeMessage);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TrackerTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      status: "todo",
      priority: "medium",
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle("");

    // Broadcast via Realtime Abstraction Layer (Cloudflare DO in Staging/Prod MVP)
    await publish("project:trackers", "TASK_ADDED", newTask);
  };

  const handleToggleTask = async (task: TrackerTask) => {
    const nextStatus: TrackerTask["status"] =
      task.status === "todo" ? "in_progress" : task.status === "in_progress" ? "done" : "todo";

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));

    await publish("project:trackers", "TASK_TOGGLED", { id: task.id, status: nextStatus });
  };

  return (
    <div className="space-y-8">
      {/* Realtime Driver Status Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-bold text-white">Realtime Transport Active</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Current Driver: <span className="font-semibold text-indigo-400 uppercase">{driverName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span>Staging/Prod: <strong className="text-purple-400">Cloudflare DO</strong></span>
          <span className="text-slate-600">|</span>
          <span>VPS Mode: <strong className="text-sky-400">Standard WS / SSE</strong></span>
        </div>
      </div>

      {/* Grid: Tasks & Live Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Project Trackers List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Live Project Trackers</h3>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-medium">
                {tasks.length} items
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex gap-3">
              <input
                type="text"
                placeholder="Enter new task or tracker title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                Add Tracker
              </button>
            </form>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-indigo-500/40 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                        task.status === "done"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : task.status === "in_progress"
                          ? "bg-amber-500/20 border-amber-500 text-amber-400"
                          : "border-slate-700 bg-slate-900"
                      }`}
                    >
                      {task.status === "done" && "✓"}
                      {task.status === "in_progress" && "•"}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        task.status === "done"
                          ? "line-through text-slate-500"
                          : "text-slate-200 group-hover:text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      task.status === "done"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : task.status === "in_progress"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Debug Stream */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
                Realtime Event Feed
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">topic: project:trackers</span>
            </div>

            <div className="h-80 overflow-y-auto space-y-2 text-xs font-mono pr-1 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-8 text-center">
                  Waiting for live updates... Add or click a task to broadcast messages.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/50 text-slate-300">
                    <span className="text-slate-500 text-[10px] block mb-0.5">{log.time}</span>
                    <span className="text-indigo-300 font-semibold">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

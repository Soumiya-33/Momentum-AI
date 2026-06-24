import React, { useState } from "react";
import { Task } from "../types";
import { Plus, Clock, Calendar, AlertCircle, Sparkles, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  tasks: Task[];
  onAddTask: (task: { name: string; deadline: string; estimatedHours: number; category: "Study" | "Work" | "Personal" }) => void;
  onToggleStatus: (id: string) => void;
  onSelectTaskForPlan: (task: Task) => void;
  setActiveTab: (tab: "dashboard" | "tasks" | "planner") => void;
}

export default function Dashboard({
  tasks,
  onAddTask,
  onToggleStatus,
  onSelectTaskForPlan,
  setActiveTab,
}: DashboardProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Study" | "Work" | "Personal">("Study");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [deadline, setDeadline] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const tasksDueToday = pendingTasks.filter((t) => t.deadline === todayStr);
  const upcomingDeadlines = pendingTasks
    .filter((t) => t.deadline > todayStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 3);

  // High priority tasks: prioritized by AI Plan score first, then by deadline closeness
  const highPriorityTasks = [...pendingTasks]
    .sort((a, b) => {
      const scoreA = a.aiPlan?.priorityScore ?? 0;
      const scoreB = b.aiPlan?.priorityScore ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA; // highest priority first
      return a.deadline.localeCompare(b.deadline); // closest deadline first
    })
    .slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Task name is required.");
      return;
    }
    onAddTask({ name, category, estimatedHours: Number(estimatedHours), deadline });
    setName("");
    setCategory("Study");
    setEstimatedHours(2);
    setDeadline(new Date().toISOString().split("T")[0]);
    setFormError("");
    setShowQuickAdd(false);
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Study":
        return "bg-blue-50/70 text-blue-700 border-blue-100/80";
      case "Work":
        return "bg-indigo-50/70 text-indigo-700 border-indigo-100/80";
      case "Personal":
        return "bg-emerald-50/70 text-emerald-700 border-emerald-100/80";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  // Build coach recommendation based on task status
  const getCoachAdvice = () => {
    if (pendingTasks.length === 0) {
      return "Excellent status. Your priority stack is empty. This is the perfect moment to reflect, upskill, or take a proactive break to prevent burnout.";
    }
    if (tasksDueToday.length > 0) {
      const leadTask = tasksDueToday[0];
      return `Friction is lowest when you start. You have ${tasksDueToday.length} task${tasksDueToday.length > 1 ? "s" : ""} due today. Direct your primary momentum to "${leadTask.name}" first. Let's block out ${leadTask.estimatedHours} estimated hours for this.`;
    }
    const closestUpcoming = pendingTasks.sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    return `Your calendar is clear today, but "${closestUpcoming.name}" is on the horizon (due ${closestUpcoming.deadline}). Proactive step: Invest just 30 minutes now to map the requirements and avoid a rushed deadline later.`;
  };

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Welcome Hero Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Active Companion Mode
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-3" id="welcome-header">
                Ready to make momentum today?
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Let's plan with absolute precision to outpace stress.
              </p>
            </div>

            <div className="border-l-4 border-indigo-500 bg-slate-50/60 p-4 rounded-r-xl">
              <span className="font-display font-semibold text-slate-800 text-sm block">
                Coach Insight
              </span>
              <p className="text-slate-600 text-sm mt-1 italic font-sans leading-relaxed">
                "{getCoachAdvice()}"
              </p>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <span className="text-slate-400 text-xs block font-medium">Today's Due</span>
                <span className="font-display text-xl font-bold text-slate-950 mt-1 block">
                  {tasksDueToday.length}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <span className="text-slate-400 text-xs block font-medium">Pending Stack</span>
                <span className="font-display text-xl font-bold text-indigo-600 mt-1 block">
                  {pendingTasks.length}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                <span className="text-slate-400 text-xs block font-medium">Completed</span>
                <span className="font-display text-xl font-bold text-emerald-600 mt-1 block">
                  {completedTasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action / Quick Add Grid block */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Instant Scheduler
            </span>
            <h2 className="font-display text-xl font-bold mt-2">
              Have a new obligation?
            </h2>
            <p className="text-indigo-200 text-xs mt-1 font-sans leading-relaxed">
              Capture it instantly before it slips. Momentum AI will assist in formatting a practical workload timeline.
            </p>
          </div>

          <div className="mt-6">
            <button
              id="dashboard-quick-add-btn"
              onClick={() => setShowQuickAdd(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-900 transition hover:bg-indigo-50 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Quick Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Rows */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Row 1: Due Today */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col h-full" id="due-today-section">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="font-display font-semibold text-slate-800">Due Today</h3>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">
              {tasksDueToday.length} item{tasksDueToday.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 stroke-1 mb-2" />
                <p className="text-slate-500 text-xs font-medium">All clear for today!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Nothing is due before midnight.</p>
              </div>
            ) : (
              tasksDueToday.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-slate-50 transition"
                >
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                  >
                    <Circle className="h-4 w-4 group-hover:scale-110 transition" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getCategoryStyles(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {task.estimatedHours}h
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectTaskForPlan(task);
                      setActiveTab("planner");
                    }}
                    title="Plan with AI"
                    className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition cursor-pointer self-center"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 2: High Priority Focus */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col h-full" id="priority-focus-section">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-600" />
              <h3 className="font-display font-semibold text-slate-800">Priority Focus Stack</h3>
            </div>
            <span className="text-[11px] text-slate-400">By urgency & planning</span>
          </div>

          <div className="flex-1 space-y-3">
            {highPriorityTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 stroke-1 mb-2" />
                <p className="text-slate-500 text-xs font-medium">Priority stack is empty!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Nice job staying ahead of deadlines.</p>
              </div>
            ) : (
              highPriorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getCategoryStyles(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" /> Due {task.deadline === todayStr ? "Today" : task.deadline}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {task.aiPlan ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Score {task.aiPlan.priorityScore}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectTaskForPlan(task);
                          setActiveTab("planner");
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        Plan <Sparkles className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Row 3: Upcoming Deadlines */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col h-full" id="upcoming-deadlines-section">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <h3 className="font-display font-semibold text-slate-800">Upcoming Horizon</h3>
            </div>
            <button
              onClick={() => setActiveTab("tasks")}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 font-medium cursor-pointer"
            >
              All Tasks <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                <Calendar className="h-8 w-8 text-slate-400 stroke-1 mb-2" />
                <p className="text-slate-500 text-xs font-medium">No upcoming deadlines.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add tasks to see your roadmap.</p>
              </div>
            ) : (
              upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-3.5 hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium text-sm truncate">{task.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" /> {task.estimatedHours}h Estimated Work
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-semibold text-slate-800 block">
                      {task.deadline.split("-")[1]}/{task.deadline.split("-")[2]}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {Math.ceil((new Date(task.deadline).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24))}d left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Slide-Over Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="quick-add-modal">
            <div className="absolute inset-0 overflow-hidden">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQuickAdd(false)}
                className="absolute inset-0 bg-slate-900 transition-opacity cursor-pointer"
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="pointer-events-auto w-screen max-w-md"
                >
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl">
                    <div className="bg-indigo-900 px-6 py-6 text-white">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">Quick Task Schedule</h2>
                        <button
                          onClick={() => setShowQuickAdd(false)}
                          className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-800 hover:text-white transition cursor-pointer"
                        >
                          <Plus className="h-5 w-5 rotate-45" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-indigo-200">
                        Input task details below. We will set up a placeholder entry immediately.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 space-y-6 px-6 py-6">
                      {formError && (
                        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Task Description / Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Draft ML Paper Methodology"
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none bg-white"
                          >
                            <option value="Study">Study</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Est. Hours
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                          Target Deadline
                        </label>
                        <input
                          type="date"
                          required
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowQuickAdd(false)}
                          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer"
                        >
                          Create Obligation
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

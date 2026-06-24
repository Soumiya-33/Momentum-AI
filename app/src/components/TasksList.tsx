import React, { useState } from "react";
import { Task } from "../types";
import { Plus, Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle, AlertCircle, X, Search, Filter, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TasksListProps {
  tasks: Task[];
  onAddTask: (task: { name: string; deadline: string; estimatedHours: number; category: "Study" | "Work" | "Personal" }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectTaskForPlan: (task: Task) => void;
  setActiveTab: (tab: "dashboard" | "tasks" | "planner") => void;
}

export default function TasksList({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleStatus,
  onSelectTaskForPlan,
  setActiveTab,
}: TasksListProps) {
  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Form states (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Study" | "Work" | "Personal">("Study");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [deadline, setDeadline] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  const handleOpenAddForm = () => {
    setEditingTask(null);
    setName("");
    setCategory("Study");
    setEstimatedHours(2);
    setDeadline(new Date().toISOString().split("T")[0]);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (task: Task) => {
    setEditingTask(task);
    setName(task.name);
    setCategory(task.category);
    setEstimatedHours(task.estimatedHours);
    setDeadline(task.deadline);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Task name is required.");
      return;
    }
    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        name: name.trim(),
        category,
        estimatedHours: Number(estimatedHours),
        deadline,
      });
    } else {
      onAddTask({
        name: name.trim(),
        category,
        estimatedHours: Number(estimatedHours),
        deadline,
      });
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "All" || task.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Study":
        return "bg-blue-50/80 text-blue-800 border-blue-200";
      case "Work":
        return "bg-indigo-50/80 text-indigo-800 border-indigo-200";
      case "Personal":
        return "bg-emerald-50/80 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6" id="tasks-list-container">
      {/* Header section with Bold theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900" id="tasks-title">
            Task Catalog
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your obligations and design your schedule. You have{" "}
            <span className="text-indigo-600 font-bold">
              {tasks.filter((t) => t.status === "Pending").length} active items
            </span>{" "}
            remaining.
          </p>
        </div>

        <button
          id="add-task-main-btn"
          onClick={handleOpenAddForm}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-shadow flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          Create Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table/List */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50/30">
            <AlertCircle className="h-10 w-10 text-slate-300 stroke-1 mb-3" />
            <p className="text-slate-600 font-bold text-lg">No matching obligations</p>
            <p className="text-slate-400 text-sm max-w-xs mt-1">
              Refine your filters, search queries, or draft a brand-new task to begin tracking.
            </p>
            <button
              onClick={handleOpenAddForm}
              className="mt-4 text-indigo-600 font-bold hover:underline text-sm flex items-center gap-1 cursor-pointer"
            >
              Create New Task <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 transition-colors"
              >
                {/* Checkbox and Info */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className="mt-1 transition cursor-pointer text-slate-300 hover:text-indigo-600 focus:outline-none"
                    title={task.status === "Completed" ? "Mark Pending" : "Mark Completed"}
                  >
                    {task.status === "Completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 group-hover:scale-105 transition" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`font-bold text-slate-800 text-lg leading-snug truncate ${
                        task.status === "Completed" ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {task.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {/* Category Badge */}
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(task.category)}`}>
                        {task.category}
                      </span>

                      {/* Deadline Indicator */}
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        Deadline: <span className="font-mono text-slate-700">{task.deadline}</span>
                      </span>

                      {/* Estimated Work */}
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Est. Labor: <span className="font-mono text-slate-700">{task.estimatedHours} hrs</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Planning, Editing, & Delete Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto pl-9 sm:pl-0">
                  {task.status === "Pending" && (
                    <button
                      onClick={() => {
                        onSelectTaskForPlan(task);
                        setActiveTab("planner");
                      }}
                      className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-indigo-100"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {task.aiPlan ? "View Plan" : "Generate Plan"}
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditForm(task)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Creation & Editing Dialog Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="task-modal">
            <div className="absolute inset-0 overflow-hidden">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFormOpen(false)}
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
                    <div className="bg-slate-900 px-6 py-6 text-white">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">
                          {editingTask ? "Modify Task" : "Formulate New Obligation"}
                        </h2>
                        <button
                          onClick={() => setIsFormOpen(false)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Provide clean parameters to ensure high-quality, practical Gemini planning templates.
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
                          Task Headline / Scope
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Finalize CS Proposal Methodology"
                          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Category Label
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none bg-white cursor-pointer"
                          >
                            <option value="Study">Study</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Estimated Labor
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
                          Obligation Deadline
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
                          onClick={() => setIsFormOpen(false)}
                          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition cursor-pointer"
                        >
                          {editingTask ? "Update Obligation" : "Confirm Obligation"}
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

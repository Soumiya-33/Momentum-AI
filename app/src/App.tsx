import React, { useState, useEffect } from "react";
import { getLocalTasks, saveLocalTasks } from "./lib/tasksStorage";
import { Task } from "./types";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import TasksList from "./components/TasksList";
import AIPlanner from "./components/AIPlanner";
import AIReflection from "./components/AIReflection";
import FocusMode from "./components/FocusMode";
import RescuePlanSlideOver from "./components/RescuePlanSlideOver";
import { Flame, CheckSquare, LayoutDashboard, Sparkles, AlertCircle, Plus, Sparkle, ShieldAlert, Lightbulb, Zap, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "planner" | "reflection" | "focus">("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rescueTask, setRescueTask] = useState<Task | null>(null);

  // Load tasks on mount
  useEffect(() => {
    setTasks(getLocalTasks());
  }, []);

  // Sync tasks to local storage whenever they change
  const handleUpdateTasksList = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveLocalTasks(newTasks);
  };

  const handleAddTask = (taskData: {
    name: string;
    deadline: string;
    estimatedHours: number;
    category: "Study" | "Work" | "Personal";
  }) => {
    const newTask: Task = {
      id: "task-" + Date.now(),
      name: taskData.name,
      deadline: taskData.deadline,
      estimatedHours: taskData.estimatedHours,
      category: taskData.category,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    handleUpdateTasksList([newTask, ...tasks]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updated = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    handleUpdateTasksList(updated);
  };

  const handleDeleteTask = (id: string) => {
    const filtered = tasks.filter((t) => t.id !== id);
    handleUpdateTasksList(filtered);
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: (t.status === "Pending" ? "Completed" : "Pending") as "Pending" | "Completed",
        };
      }
      return t;
    });
    handleUpdateTasksList(updated);
  };

  // Custom user name state from localStorage (or generic default if not explicitly set)
  const [customName, setCustomName] = useState<string>(() => {
    return localStorage.getItem("momentum_user_name") || "";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    setCustomName(trimmed);
    if (trimmed) {
      localStorage.setItem("momentum_user_name", trimmed);
    } else {
      localStorage.removeItem("momentum_user_name");
    }
    setIsEditingName(false);
  };

  // Compute stats
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const todayStr = new Date().toISOString().split("T")[0];
  const dueTodayCount = pendingTasks.filter((t) => t.deadline === todayStr).length;

  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;

  // Streak calculation (completed tasks today and previously)
  const streakDays = completedTasks.length > 0 ? Math.min(14, 3 + completedTasks.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-indigo-100 antialiased">
      {/* Sidebar Navigation - Desktop-first layout */}
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen justify-between">
        <div className="space-y-8">
          {/* Logo with Bold styling */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800 block leading-none">
                Momentum <span className="text-indigo-600">AI</span>
              </span>
              <span className="text-[9px] font-mono font-semibold tracking-widest text-slate-400 uppercase mt-1 block">
                Productivity coach
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
              Dashboard
              {dueTodayCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                  {dueTodayCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                activeTab === "tasks"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
              Tasks
              {pendingTasks.length > 0 && (
                <span className="ml-auto bg-slate-100 text-slate-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200">
                  {pendingTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("planner")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                activeTab === "planner"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              AI Planner
            </button>

            <button
              onClick={() => setActiveTab("focus")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                activeTab === "focus"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Zap className="w-4 h-4 stroke-[2.5]" />
              Focus Space
              {pendingTasks.length > 0 && (
                <span className="ml-auto bg-indigo-100 text-indigo-700 font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-indigo-200">
                  {pendingTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("reflection")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer ${
                activeTab === "reflection"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                  : "text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-700"
              }`}
            >
              <BarChart3 className="w-4 h-4 stroke-[2.5]" />
              Momentum Snapshot
            </button>
          </nav>
        </div>

        {/* Dynamic Coach progress meter */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Daily Momentum
          </p>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">
              {progressPercent}% Complete
            </p>
            <span className="text-[10px] text-slate-400">
              {completedTasks.length}/{totalTasksCount} done
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="block md:hidden w-full">
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dueTodayCount={dueTodayCount}
        />
      </div>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full md:max-h-screen">
        {/* Dynamic Top Greeting Area */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 py-1 flex-wrap">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  placeholder="Enter your name..."
                  maxLength={25}
                  className="rounded-xl border border-indigo-200 px-3 py-1 text-base font-bold text-slate-800 bg-white focus:border-indigo-500 focus:outline-none max-w-[200px]"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900">
                  {customName ? `Welcome back, ${customName}.` : "Welcome to Momentum AI"}
                </h1>
                <button
                  onClick={() => {
                    setTempName(customName);
                    setIsEditingName(true);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition ml-2 cursor-pointer self-center"
                  title={customName ? "Edit name" : "Set your name"}
                >
                  {customName ? "Edit" : "Set Name"}
                </button>
              </div>
            )}
            <p className="text-slate-500 font-medium text-sm sm:text-base">
              You have <span className="text-indigo-600 font-bold">{pendingTasks.length} high-impact tasks</span> to tackle today.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm self-start sm:self-auto">
            <div className="bg-amber-500 text-white rounded-lg p-1.5 flex items-center justify-center">
              <Flame className="h-4 w-4 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Productivity Streak
              </span>
              <span className="text-sm font-black text-slate-800">
                {streakDays} Days Active
              </span>
            </div>
          </div>
        </header>

        {/* Tab Router Section with Micro Page Entry Animations */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onToggleStatus={handleToggleStatus}
                  onSelectTaskForPlan={setSelectedTask}
                  setActiveTab={setActiveTab}
                  onOpenRescuePlan={setRescueTask}
                />
              )}

              {activeTab === "tasks" && (
                <TasksList
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                  onSelectTaskForPlan={setSelectedTask}
                  setActiveTab={setActiveTab}
                  onOpenRescuePlan={setRescueTask}
                />
              )}

              {activeTab === "planner" && (
                <AIPlanner
                  tasks={tasks}
                  selectedTask={selectedTask}
                  onSelectTask={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}

              {activeTab === "reflection" && (
                <AIReflection
                  tasks={tasks}
                  onSelectTask={setSelectedTask}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === "focus" && (
                <FocusMode
                  tasks={tasks}
                  initialSelectedTask={selectedTask}
                  onToggleStatus={handleToggleStatus}
                  onBackToDashboard={() => setActiveTab("dashboard")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Credit Line matching standard humble guidelines */}
        <footer className="mt-16 border-t border-slate-100 pt-6 pb-4 text-center text-xs text-slate-400 flex flex-col sm:flex-row sm:justify-between gap-2">
          <span>Momentum AI Productivity Coaching &copy; 2026. All plans saved locally.</span>
          <span className="font-mono text-[10px]">Powered by Gemini 3.5 Flash server-side APIs</span>
        </footer>

        <RescuePlanSlideOver
          task={rescueTask}
          isOpen={!!rescueTask}
          onClose={() => setRescueTask(null)}
          onUpdateTask={handleUpdateTask}
          onStartFocus={(t) => {
            setSelectedTask(t);
            setActiveTab("focus");
          }}
        />
      </main>
    </div>
  );
}

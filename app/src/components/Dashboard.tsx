import React, { useState } from "react";
import { Task } from "../types";
import { calculateTaskRisk } from "../lib/riskPredictor";
import { 
  Plus, Clock, Calendar, AlertCircle, Sparkles, CheckCircle2, Circle, 
  ArrowRight, AlertTriangle, Flame, ShieldAlert, Lightbulb, Zap, 
  ChevronDown, ChevronUp, CheckSquare, BarChart3, TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  tasks: Task[];
  onAddTask: (task: { name: string; deadline: string; estimatedHours: number; category: "Study" | "Work" | "Personal" }) => void;
  onToggleStatus: (id: string) => void;
  onSelectTaskForPlan: (task: Task) => void;
  setActiveTab: (tab: "dashboard" | "tasks" | "planner" | "reflection" | "focus") => void;
  onOpenRescuePlan: (task: Task) => void;
}

export default function Dashboard({
  tasks,
  onAddTask,
  onToggleStatus,
  onSelectTaskForPlan,
  setActiveTab,
  onOpenRescuePlan,
}: DashboardProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Study" | "Work" | "Personal">("Study");
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [deadline, setDeadline] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");
  
  // State for expandable sections
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Filters
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  // Today's Focus - Top 3 tasks only
  const todayFocusTasks = pendingTasks
    .filter((t) => t.deadline === todayStr)
    .slice(0, 3);

  // Remaining pending if less than 3 due today, backfill with high-priority upcoming
  const todayFocusList = todayFocusTasks.length < 3
    ? [
        ...todayFocusTasks,
        ...pendingTasks
          .filter((t) => t.deadline !== todayStr)
          .sort((a, b) => {
            const scoreA = a.aiPlan?.priorityScore ?? 0;
            const scoreB = b.aiPlan?.priorityScore ?? 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.deadline.localeCompare(b.deadline);
          })
      ].slice(0, 3)
    : todayFocusTasks;

  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;
  const streakDays = completedTasks.length > 0 ? Math.min(14, 3 + completedTasks.length) : 0;

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
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Work":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "Personal":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  // Build top 3 important insights max (completely local)
  const generateDynamicInsights = () => {
    const feed: { 
      type: "alert" | "warning" | "recommendation" | "boost"; 
      text: string; 
      subtext: string;
      details: string;
    }[] = [];

    // 1. Overdue Tasks Alert
    const delayedTasks = pendingTasks.filter(t => {
      const deadlineDate = new Date(t.deadline);
      const today = new Date(todayStr);
      return deadlineDate < today && t.deadline !== todayStr;
    });

    if (delayedTasks.length > 0) {
      feed.push({
        type: "alert",
        text: `Overdue Alert: You have ${delayedTasks.length} task${delayedTasks.length !== 1 ? "s" : ""} past due.`,
        subtext: "Immediately reschedule or conquer these tasks to protect your focus streak.",
        details: "Delayed tasks create psychological debt. Breaking them into 10-minute micro-sessions on the Focus Space can help lower the entry barrier."
      });
    }

    // 2. High-Risk Tasks Alert
    const highRiskTasks = pendingTasks
      .map(t => ({ task: t, risk: calculateTaskRisk(t, tasks) }))
      .filter(item => item.risk.level === "Critical" || item.risk.level === "High")
      .sort((a, b) => b.risk.score - a.risk.score);

    if (highRiskTasks.length > 0) {
      const topRisk = highRiskTasks[0];
      feed.push({
        type: "alert",
        text: `High-Risk Warning: "${topRisk.task.name}" has escalated to ${topRisk.risk.level} risk.`,
        subtext: topRisk.risk.recommendedAction,
        details: `Cognitive Load Prediction model estimates a high probability of bottlenecking due to close deadline (${topRisk.task.deadline}) and ${topRisk.task.estimatedHours} hours of labor.`
      });
    }

    // 3. Upcoming Deadlines Check
    if (todayFocusTasks.length > 0) {
      feed.push({
        type: "warning",
        text: `Upcoming Deadline: ${todayFocusTasks.length} core target${todayFocusTasks.length !== 1 ? "s" : ""} due today.`,
        subtext: `Completing these scheduled slots frees up ${todayFocusTasks.reduce((acc, t) => acc + t.estimatedHours, 0)} hours of cognitive load.`,
        details: "Focusing strictly on today's due items protects your activation threshold and guarantees your active daily streak is locked in."
      });
    }

    // 4. Productivity Milestones (Streak/Progress) Boost
    if (completedTasks.length > 0) {
      feed.push({
        type: "boost",
        text: `Productivity Milestone: ${completedTasks.length} task${completedTasks.length !== 1 ? "s" : ""} finished today!`,
        subtext: `Excellent velocity. Your dynamic streak is climbing and fully protected.`,
        details: "Success breeds success. Your current brain wave sync indicates ideal task velocity. Leverage this state of flow for another focus slot!"
      });
    } else if (progressPercent >= 50) {
      feed.push({
        type: "boost",
        text: `Progress Achievement: ${progressPercent}% of all tasks completed.`,
        subtext: "Outstanding progress ratio. Keep driving your momentum forward.",
        details: "You've officially crossed the midway milestone! Keep utilizing structured AI Planning templates to slice up the remaining backlog."
      });
    }

    // General fallback recommendation if feed is empty
    if (feed.length === 0) {
      if (pendingTasks.length > 3) {
        feed.push({
          type: "recommendation",
          text: `Backlog Buffer Active (${pendingTasks.length} tasks scheduled).`,
          subtext: "Break your workloads into smaller focus periods to avoid activation fatigue.",
          details: "A crowded list of obligations causes micro-procrastination. Go to Focus Space and select one item to block out the noise."
        });
      } else {
        feed.push({
          type: "recommendation",
          text: "Momentum Canvas Optimized",
          subtext: "No immediate risks. Map out future milestones to stay ahead of the curve.",
          details: "A clear canvas is the best place to design future sprints. Set up a few milestones for the coming days to maintain pacing."
        });
      }
    }

    return feed.slice(0, 3);
  };

  const insights = generateDynamicInsights();

  // Get current date string beautifully
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 md:space-y-8" id="dashboard-container">
      
      {/* Notion/Linear Top Redesigned Header Area */}
      <div 
        className="relative overflow-hidden bg-white/70 border border-slate-200/50 p-6 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4" 
        id="dashboard-header-block"
      >
        {/* Subtle decorative background gradient accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <p className="text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            {formattedDate}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Make momentum today.
          </h2>
        </div>
        
        <button
          id="add-task-header-btn"
          onClick={() => setShowQuickAdd(true)}
          className="z-10 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto hover:-translate-y-0.5 duration-150 shadow-sm border border-slate-800"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          Add Task
        </button>
      </div>

      {/* Main Grid: Momentum Overview & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Widget 1: Momentum Overview */}
        <div 
          className="md:col-span-2 rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between space-y-6 hover:shadow-xs transition-shadow duration-200" 
          id="momentum-overview-widget"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                Momentum Stats
              </span>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                <Flame className="h-3 w-3 fill-current" /> Active
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="h-11 w-11 bg-amber-50/70 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100">
                <Flame className="h-5.5 w-5.5 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Streak: {streakDays} Days Active</h4>
                <p className="text-xs text-slate-500">Completing daily items powers your productivity coefficient.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1"><CheckSquare className="h-3.5 w-3.5 text-indigo-500" /> Overall Progress</span>
              <span className="font-mono">{progressPercent}%</span>
            </div>
            
            {/* Smooth linear progress bar */}
            <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-100">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>{completedTasks.length} cleared obligations</span>
              <span>{totalTasksCount - completedTasks.length} remaining</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Quick Actions / Launchpad */}
        <div 
          className="rounded-3xl border border-slate-200/50 bg-slate-900 text-white p-6 shadow-sm flex flex-col justify-between hover:shadow-xs transition-shadow duration-200 relative overflow-hidden" 
          id="quick-actions-widget"
        >
          {/* Subtle graphic flare */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300">
              Launchpad
            </span>
            <h3 className="font-display text-base font-bold mt-2">Productivity Suite</h3>
            <p className="text-indigo-200/70 text-xs mt-1 leading-relaxed font-medium">
              Trigger AI blueprints, launch an immersive focus timer, or check momentum snapshot.
            </p>
          </div>

          <div className="grid gap-2 mt-5 z-10">
            {/* Quick start generic Focus Mode */}
            <button
              onClick={() => setActiveTab("focus")}
              className="flex items-center gap-2.5 w-full bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer shadow-sm border border-indigo-700 hover:translate-x-0.5 duration-150"
            >
              <Zap className="h-3.5 w-3.5 text-white fill-current" />
              Focus Space
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className="flex items-center gap-2.5 w-full bg-white/5 hover:bg-white/10 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer border border-white/5 hover:translate-x-0.5 duration-150"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              AI Planner
            </button>
            <button
              onClick={() => {
                const highRiskTasks = tasks
                  .filter(t => t.status === "Pending")
                  .map(t => ({ task: t, risk: calculateTaskRisk(t, tasks) }))
                  .filter(item => item.risk.level === "High" || item.risk.level === "Critical")
                  .sort((a, b) => b.risk.score - a.risk.score);
                
                if (highRiskTasks.length > 0) {
                  onOpenRescuePlan(highRiskTasks[0].task);
                } else {
                  setActiveTab("tasks");
                }
              }}
              className="flex items-center gap-2.5 w-full bg-white/5 hover:bg-white/10 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer border border-white/5 hover:translate-x-0.5 duration-150"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-300" />
              Rescue Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Focus & Insights */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Widget 2: Today's Focus (Top 3 tasks only with Focus trigger) */}
        <div 
          className="rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between hover:shadow-xs transition-shadow duration-200" 
          id="todays-focus-widget"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="font-display font-bold text-slate-800 text-sm">Focus Queue <span className="text-slate-400 font-normal">({todayFocusList.length > 0 ? "Top 3" : "0"} scheduled)</span></h3>
            </div>
            <button
              onClick={() => setActiveTab("tasks")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition cursor-pointer flex items-center gap-0.5 hover:underline"
            >
              Catalog <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {todayFocusList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 p-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 stroke-1 mb-2" />
                <p className="text-slate-700 text-xs font-bold">Workspace fully clear</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5 leading-relaxed font-medium">All obligations checked off or rescheduled. Enjoy your breathing space!</p>
              </div>
            ) : (
              todayFocusList.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 p-3 hover:bg-slate-50 hover:border-slate-200/50 transition-all"
                >
                  <button
                    onClick={() => onToggleStatus(task.id)}
                    className="text-slate-400 hover:text-indigo-600 transition cursor-pointer flex-shrink-0"
                    title="Mark Done"
                  >
                    <Circle className="h-4 w-4 group-hover:scale-105 transition" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-bold text-xs truncate leading-snug">{task.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getCategoryStyles(task.category)}`}>
                        {task.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {task.estimatedHours}h
                      </span>
                      {(() => {
                        const risk = calculateTaskRisk(task, tasks);
                        return (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            risk.level === "Critical" ? "bg-red-50 text-red-600 border-red-100" :
                            risk.level === "High" ? "bg-orange-50 text-orange-600 border-orange-100" :
                            risk.level === "Medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-emerald-50 text-emerald-600 border-emerald-100"
                          }`}>
                            {risk.level}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* New Quick Focus Space Trigger (Interactive Integration) */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const risk = calculateTaskRisk(task, tasks);
                      const isHighRisk = risk.level === "High" || risk.level === "Critical";
                      if (!isHighRisk) return null;
                      return (
                        <button
                          onClick={() => onOpenRescuePlan(task)}
                          title="Formulate Emergency Rescue Plan"
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-lg transition cursor-pointer flex items-center justify-center animate-pulse"
                        >
                          <ShieldAlert className="h-3 w-3" />
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => {
                        onSelectTaskForPlan(task);
                        setActiveTab("focus");
                      }}
                      title="Launch Focus Session"
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-600 rounded-lg transition cursor-pointer flex items-center justify-center"
                    >
                      <Zap className="h-3 w-3 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        onSelectTaskForPlan(task);
                        setActiveTab("planner");
                      }}
                      title="Plan with AI"
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 text-slate-500 hover:text-slate-700 rounded-lg transition cursor-pointer flex items-center justify-center"
                    >
                      <Sparkles className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 3: AI Insights Feed with expandable cards to reduce clutter */}
        <div 
          className="rounded-3xl border border-slate-200/50 bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between hover:shadow-xs transition-shadow duration-200" 
          id="ai-insights-feed-widget"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
              <h3 className="font-display font-bold text-slate-800 text-sm">AI Coach Guidance</h3>
            </div>
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Expandable alerts</span>
          </div>

          <div className="flex-1 space-y-2.5">
            {insights.map((insight, idx) => {
              const isExpanded = expandedInsight === idx;
              
              const getIcon = () => {
                switch (insight.type) {
                  case "alert": return <AlertTriangle className="h-4 w-4 text-rose-600" />;
                  case "warning": return <ShieldAlert className="h-4 w-4 text-orange-600" />;
                  case "recommendation": return <Sparkles className="h-4 w-4 text-indigo-600" />;
                  case "boost": return <Flame className="h-4 w-4 text-amber-500" />;
                }
              };
              
              const getBg = () => {
                switch (insight.type) {
                  case "alert": return "bg-rose-50/40 border-rose-100/60 hover:bg-rose-50/60";
                  case "warning": return "bg-orange-50/40 border-orange-100/60 hover:bg-orange-50/60";
                  case "recommendation": return "bg-indigo-50/40 border-indigo-100/60 hover:bg-indigo-50/60";
                  case "boost": return "bg-amber-50/40 border-amber-100/60 hover:bg-amber-50/60";
                }
              };
              
              return (
                <div 
                  key={idx} 
                  onClick={() => setExpandedInsight(isExpanded ? null : idx)}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 transition-all cursor-pointer ${getBg()} ${isExpanded ? "ring-1 ring-slate-200/50 shadow-xs" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2.5 items-center">
                      <div className="flex-shrink-0">{getIcon()}</div>
                      <h4 className="text-[11px] font-bold text-slate-800 leading-snug">{insight.text}</h4>
                    </div>
                    <div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 pl-6.5 leading-relaxed font-medium">
                    {insight.subtext}
                  </p>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden pl-6.5"
                      >
                        <div className="pt-2 border-t border-slate-100 mt-2 text-[10px] text-slate-600 italic leading-relaxed font-medium bg-white/30 p-2 rounded-xl">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Coach Deep Dive</span>
                          {insight.details}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
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
                    <div className="bg-slate-950 px-6 py-6 text-white border-b border-slate-900 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center justify-between z-10 relative">
                        <h2 className="font-display text-base font-bold">Formulate Obligation</h2>
                        <button
                          onClick={() => setShowQuickAdd(false)}
                          className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                        >
                          <Plus className="h-4 w-4 rotate-45 stroke-[2.5]" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 font-medium">
                        Log task details below to enable immediate AI Planning templates.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex-1 space-y-6 px-6 py-6 bg-slate-50/50">
                      {formError && (
                        <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 font-medium">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Task Headline / Description
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Draft CS Proposal Methodology"
                          className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Study">Study</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Est. Labor (hrs)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={estimatedHours}
                            onChange={(e) => setEstimatedHours(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Target Deadline
                        </label>
                        <input
                          type="date"
                          required
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="pt-6 border-t border-slate-200/60 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowQuickAdd(false)}
                          className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
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

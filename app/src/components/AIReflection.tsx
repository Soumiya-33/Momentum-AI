import React from "react";
import { Task } from "../types";
import { calculateTaskRisk } from "../lib/riskPredictor";
import { 
  Flame, CheckCircle2, AlertTriangle, Target, Lightbulb, 
  ArrowRight, Sparkles, TrendingUp, BarChart3, Clock, Zap
} from "lucide-react";
import { motion } from "motion/react";

interface AIReflectionProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  setActiveTab: (tab: "dashboard" | "tasks" | "planner" | "rescue" | "reflection" | "focus") => void;
}

export default function AIReflection({ tasks, onSelectTask, setActiveTab }: AIReflectionProps) {
  // 1. Core Analytics Setup
  const completedTasks = tasks.filter((t) => t.status === "Completed");
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  
  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTasks = pendingTasks.filter((t) => {
    const deadlineDate = new Date(t.deadline);
    const today = new Date(todayStr);
    return deadlineDate < today && t.deadline !== todayStr;
  });

  const totalCount = tasks.length;
  const completedCount = completedTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Streak days
  const streakDays = completedCount > 0 ? Math.min(14, 3 + completedCount) : 0;

  // 2. 🔥 Momentum Score Formula (Bounded 0-100)
  // Higher completion rate is primary, active streak boosts, overdue tasks penalize heavily
  let momentumScore = 0;
  if (totalCount > 0) {
    momentumScore = Math.round(
      (completionRate * 0.7) + (streakDays * 3) - (overdueTasks.length * 10)
    );
  } else {
    momentumScore = 50; // Neutral baseline with empty canvas
  }
  momentumScore = Math.max(0, Math.min(100, momentumScore));

  // Determine Score Vibe / Quality Level
  let scoreLabel = "NEUTRAL";
  let scoreColor = "text-slate-400";
  let scoreGlow = "bg-slate-500/10";
  let scoreTextClass = "from-slate-400 to-slate-600";

  if (momentumScore >= 80) {
    scoreLabel = "VIGOROUS FLOW";
    scoreColor = "text-emerald-500 border-emerald-500/20";
    scoreGlow = "bg-emerald-500/10";
    scoreTextClass = "from-emerald-400 to-emerald-600";
  } else if (momentumScore >= 50) {
    scoreLabel = "STABLE PACE";
    scoreColor = "text-indigo-500 border-indigo-500/20";
    scoreGlow = "bg-indigo-500/10";
    scoreTextClass = "from-indigo-400 to-indigo-600";
  } else {
    scoreLabel = "CRITICAL DRAG";
    scoreColor = "text-rose-500 border-rose-500/20";
    scoreGlow = "bg-rose-500/10";
    scoreTextClass = "from-rose-400 to-rose-600";
  }

  // 3. ⚠️ Find Highest Risk Task
  const highRiskTasks = pendingTasks
    .map((t) => ({ task: t, risk: calculateTaskRisk(t, tasks) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const highestRiskTaskItem = highRiskTasks[0]?.task || null;
  const highestRiskLevel = highRiskTasks[0]?.risk?.level || "None";
  const highestRiskTip = highRiskTasks[0]?.risk?.recommendedAction || "";

  // 4. 🎯 Tomorrow's Top Priority
  // Sort pending tasks by proximity of deadline, then estimated labor
  const sortedPriorityTasks = [...pendingTasks].sort((a, b) => {
    const isOverdueA = new Date(a.deadline) < new Date(todayStr);
    const isOverdueB = new Date(b.deadline) < new Date(todayStr);
    if (isOverdueA !== isOverdueB) return isOverdueA ? -1 : 1;
    
    // Sort by priorityScore if generated
    const scoreA = a.aiPlan?.priorityScore ?? 0;
    const scoreB = b.aiPlan?.priorityScore ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    return a.deadline.localeCompare(b.deadline);
  });
  const tomorrowsPriority = sortedPriorityTasks[0] || null;

  // 5. 💡 Generate One-Line AI Productivity Tip Dynamically
  const getDynamicTip = () => {
    if (totalCount === 0) {
      return "Your canvas is completely clear. Feed the catalog one high-impact priority to kickstart your kinetic flow.";
    }
    if (overdueTasks.length > 0) {
      const taskName = overdueTasks[0].name;
      return `Neutralize cognitive debt: Launch a 15-minute Focus Session on "${taskName}" to bypass activation friction.`;
    }
    if (highestRiskTaskItem && (highestRiskLevel === "Critical" || highestRiskLevel === "High")) {
      return `Mitigate bottleneck: Breakdown "${highestRiskTaskItem.name}" into three bite-sized checklists under AI Planner before tomorrow.`;
    }
    if (completionRate >= 80) {
      return "Flow state confirmed. Protect your active streak by scheduling a brief 10-minute inbox/workspace review.";
    }
    if (pendingTasks.length > 3) {
      return "Workload density is climbing. Avoid micro-procrastination by selecting exactly one item in Focus Space.";
    }
    return "Momentum matrix optimized. Keep your daily activation energy low with structured morning milestones.";
  };

  const dynamicTip = getDynamicTip();

  // Category progress breakdowns
  const getCategoryProgress = (cat: "Study" | "Work" | "Personal") => {
    const catTasks = tasks.filter((t) => t.category === cat);
    if (catTasks.length === 0) return null;
    const catCompleted = catTasks.filter((t) => t.status === "Completed").length;
    return {
      completed: catCompleted,
      total: catTasks.length,
      percent: Math.round((catCompleted / catTasks.length) * 100)
    };
  };

  const studyProg = getCategoryProgress("Study");
  const workProg = getCategoryProgress("Work");
  const personalProg = getCategoryProgress("Personal");

  // Animation variants for modular bento entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="space-y-6 md:space-y-8" id="snapshot-page-wrapper">
      
      {/* Header Block */}
      <div className="relative overflow-hidden bg-white border border-slate-200/50 p-6 rounded-3xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <p className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Productivity Analytics
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Momentum Snapshot
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            A clean, 10-second calibration of your daily execution pacing and bottleneck risks.
          </p>
        </div>
        
        <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100/50 flex-shrink-0">
          <BarChart3 className="h-6 w-6" />
        </div>
      </div>

      {/* Bento-style Metric Layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 md:grid-cols-6"
        id="snapshot-bento-grid"
      >
        
        {/* Card 1: 🔥 Momentum Score (Large Bento block) */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-3 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[260px] group hover:border-slate-300 transition-colors"
          id="snapshot-momentum-score-card"
        >
          {/* Subtle colored glow backing */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full ${scoreGlow} blur-3xl pointer-events-none`} />

          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Momentum Score
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border bg-white ${scoreColor}`}>
              {scoreLabel}
            </span>
          </div>

          <div className="my-auto flex items-center gap-6 py-4 z-10">
            <div className="relative flex items-center justify-center">
              {/* Score Outer Ring */}
              <div className="w-24 h-24 rounded-full border border-slate-100 flex items-center justify-center shadow-inner relative bg-slate-50/50">
                <svg className="absolute -rotate-90 w-full h-full p-0.5">
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  <circle 
                    cx="50%" 
                    cy="50%" 
                    r="45%" 
                    fill="none" 
                    stroke={momentumScore >= 80 ? "#10b981" : momentumScore >= 50 ? "#6366f1" : "#f43f5e"} 
                    strokeWidth="5" 
                    strokeDasharray="282"
                    strokeDashoffset={282 - (282 * momentumScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                  {momentumScore}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-slate-800">Kinetic Velocity Index</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Your current score is calculated using complete metrics, active streaks, and risk management coefficients.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-50 pt-3 flex justify-between items-center z-10 text-[10px] text-slate-400 font-semibold">
            <span>Streak Buffer: {streakDays} days active</span>
            <span>Risk Penalty: -{overdueTasks.length * 10}pts</span>
          </div>
        </motion.div>

        {/* Card 2: ✅ Task Completion Rate */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-3 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[260px] hover:border-slate-300 transition-colors"
          id="snapshot-completion-rate-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Task Completion Rate
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {completedCount}/{totalCount} Completed
            </span>
          </div>

          <div className="my-auto py-3 space-y-4">
            {/* Huge completion rate percentage indicator */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-indigo-600 bg-gradient-to-r from-indigo-500 to-indigo-600 bg-clip-text text-transparent">
                {completionRate}%
              </span>
              <span className="text-xs font-bold text-slate-500">of scheduled deliverables</span>
            </div>

            {/* Category breakdown meters */}
            <div className="space-y-2.5">
              {studyProg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>Study Progress</span>
                    <span className="font-mono">{studyProg.percent}% ({studyProg.completed}/{studyProg.total})</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${studyProg.percent}%` }} />
                  </div>
                </div>
              )}
              {workProg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>Work Progress</span>
                    <span className="font-mono">{workProg.percent}% ({workProg.completed}/{workProg.total})</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${workProg.percent}%` }} />
                  </div>
                </div>
              )}
              {personalProg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>Personal Progress</span>
                    <span className="font-mono">{personalProg.percent}% ({personalProg.completed}/{personalProg.total})</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${personalProg.percent}%` }} />
                  </div>
                </div>
              )}
              {!studyProg && !workProg && !personalProg && (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-[10px] text-slate-400 font-semibold italic">
                  No categories currently logged.
                </div>
              )}
            </div>
          </div>

          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
            Completing obligations increases daily velocity and builds positive habit inertia.
          </p>
        </motion.div>

        {/* Card 3: ⚠️ Highest Risk Task */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-3 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[220px] hover:border-slate-300 transition-colors"
          id="snapshot-highest-risk-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Highest Risk Bottleneck
            </span>
            {highestRiskTaskItem && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                highestRiskLevel === "Critical" ? "bg-red-50 text-red-600 border-red-100" :
                highestRiskLevel === "High" ? "bg-orange-50 text-orange-600 border-orange-100" :
                "bg-amber-50 text-amber-600 border-amber-100"
              }`}>
                {highestRiskLevel} RISK
              </span>
            )}
          </div>

          {highestRiskTaskItem ? (
            <div className="my-auto py-2.5 space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                  {highestRiskTaskItem.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span>Category: {highestRiskTaskItem.category}</span>
                  <span>&bull;</span>
                  <span>Est: {highestRiskTaskItem.estimatedHours}h labor</span>
                </div>
              </div>

              {highestRiskTip && (
                <div className="p-3 bg-amber-50/40 border border-amber-100/30 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 leading-relaxed font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{highestRiskTip}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto py-6 text-center space-y-1.5">
              <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-slate-700 text-xs font-bold">Workspace Safe</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                No high-risk bottlenecks predicted. Deadlines are safe and well-distributed.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            {highestRiskTaskItem ? (
              <button
                onClick={() => {
                  onSelectTask(highestRiskTaskItem);
                  setActiveTab("planner");
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1 hover:underline"
              >
                Triage with AI <ArrowRight className="h-3 w-3" />
              </button>
            ) : (
              <div className="h-4" />
            )}
          </div>
        </motion.div>

        {/* Card 4: 🎯 Tomorrow's Top Priority */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-3 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[220px] hover:border-slate-300 transition-colors"
          id="snapshot-top-priority-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Tomorrow's Top Priority
            </span>
            <Target className="h-4 w-4 text-indigo-500" />
          </div>

          {tomorrowsPriority ? (
            <div className="my-auto py-2.5 space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                  {tomorrowsPriority.name}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                  <span className="px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100 font-bold text-slate-600">
                    {tomorrowsPriority.category}
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <Clock className="h-3 w-3" /> Due: {tomorrowsPriority.deadline}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                This item has been flagged as the single highest lever to build early morning momentum tomorrow.
              </p>
            </div>
          ) : (
            <div className="my-auto py-6 text-center space-y-1.5">
              <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-slate-700 text-xs font-bold">Priority Pristine</p>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                All scheduled obligations completed. Log a new task in the catalog to prepare your next milestone block.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-slate-50">
            <span className="text-[9px] text-slate-400 font-medium">
              {tomorrowsPriority ? "Highly optimized starting block" : "Zero obligations pending"}
            </span>
            {tomorrowsPriority && (
              <button
                onClick={() => {
                  onSelectTask(tomorrowsPriority);
                  setActiveTab("focus");
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1 hover:underline"
              >
                <Zap className="h-3.5 w-3.5 text-indigo-500 fill-indigo-50" />
                Launch Focus Space
              </button>
            )}
          </div>
        </motion.div>

        {/* Card 5: Full-Width 💡 One-line AI Productivity Tip Banner */}
        <motion.div 
          variants={itemVariants}
          className="md:col-span-6 bg-gradient-to-r from-indigo-950 to-slate-950 text-white rounded-3xl p-5 border border-indigo-950 relative overflow-hidden flex items-center gap-4 group"
          id="snapshot-ai-tip-banner"
        >
          {/* Subtle flare backing */}
          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-300" />
          
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 border border-white/5 flex-shrink-0">
            <Lightbulb className="h-5 w-5 fill-indigo-400 text-indigo-300" />
          </div>
          
          <div className="space-y-0.5 min-w-0 flex-1 z-10">
            <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-widest block">AI Coach Direct Directive</span>
            <p className="text-xs text-indigo-100 font-semibold tracking-tight leading-relaxed truncate md:whitespace-normal">
              "{dynamicTip}"
            </p>
          </div>
        </motion.div>

      </motion.div>

    </div>
  );
}

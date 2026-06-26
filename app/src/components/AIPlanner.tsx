import React, { useState, useEffect } from "react";
import { Task, AIPlan, ActionStep } from "../types";
import { Sparkles, Calendar, Clock, ArrowRight, ShieldAlert, CheckCircle2, ChevronRight, Loader2, RefreshCw, Flame, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIPlannerProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelectTask: (task: Task | null) => void;
  onUpdateTask: (task: Task) => void;
}

export default function AIPlanner({
  tasks,
  selectedTask,
  onSelectTask,
  onUpdateTask,
}: AIPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [cloudAIBusy, setCloudAIBusy] = useState(false);

  // Loading animation cycle of progress states
  const loadingSteps = [
    "Analyzing task",
    "Calculating priority",
    "Creating action plan",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const pendingTasks = tasks.filter((t) => t.status === "Pending");

  // When selected task is changed, let's auto-scroll to the planning card or top
  useEffect(() => {
    if (selectedTask) {
      const el = document.getElementById("planner-view-scroll");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [selectedTask]);

  const enrichPlanWithLocalLogic = (task: Task, actionSteps: ActionStep[]): AIPlan => {
    // 1. Calculate days left
    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date(todayStr);
    const deadlineDate = new Date(task.deadline || todayStr);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // 2. Calculate priority score and urgency level
    const workloadRatio = task.estimatedHours / daysLeft;
    let urgencyLevel: 'Low' | 'Medium' | 'High' = 'Medium';
    let priorityScore = 5;

    if (workloadRatio > 4 || daysLeft <= 1) {
      urgencyLevel = 'High';
      priorityScore = Math.min(10, 8 + Math.round(task.estimatedHours / 10));
    } else if (workloadRatio < 1.5 && daysLeft > 4) {
      urgencyLevel = 'Low';
      priorityScore = Math.max(1, 3 + Math.round(task.estimatedHours / 10));
    } else {
      urgencyLevel = 'Medium';
      priorityScore = Math.min(9, 5 + Math.round(task.estimatedHours / 10));
    }

    // 3. Generate estimated completion time
    const completionDate = new Date();
    if (daysLeft > 1) {
      completionDate.setDate(completionDate.getDate() + Math.max(1, daysLeft - 1));
    } else {
      // Completed today
    }
    const formattedCompletionDate = completionDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    const estimatedCompletionTime = daysLeft > 1 
      ? `Scheduled to complete by ${formattedCompletionDate} (with a 1-day safety buffer before deadline)`
      : `Scheduled for immediate completion today, ${formattedCompletionDate} (critical deadline)`;

    // 4. Generate local coach rationale / explanation
    let explanation = "";
    if (task.category === "Study") {
      explanation = `With ${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining, prioritizing focused study blocks and active recall will ensure you master this material without last-minute panic.`;
    } else if (task.category === "Work") {
      explanation = `This work milestone requires structured delivery. Breaking it down into focused sprints ensures high-quality output while keeping stress levels low.`;
    } else {
      explanation = `Personal goals are easily postponed. Setting concrete milestone blocks is the perfect way to build real momentum and get this done.`;
    }

    // 5. Timeline Generation (distribute action steps across available days)
    const enrichedSteps = actionSteps.map((step, index) => {
      const stepDate = new Date();
      const targetDaysOffset = daysLeft > 1
        ? Math.min(daysLeft - 1, Math.round((index / Math.max(1, actionSteps.length - 1)) * (daysLeft - 1)))
        : 0;
      stepDate.setDate(stepDate.getDate() + targetDaysOffset);
      
      const formattedStepDate = stepDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      
      let timelineLabel = "";
      if (daysLeft === 1) {
        const percent = index / actionSteps.length;
        if (percent < 0.33) {
          timelineLabel = "Morning Block (Today)";
        } else if (percent < 0.66) {
          timelineLabel = "Afternoon Block (Today)";
        } else {
          timelineLabel = "Evening Block (Today)";
        }
      } else {
        const isToday = targetDaysOffset === 0;
        const isTomorrow = targetDaysOffset === 1;
        if (isToday) {
          timelineLabel = `Today (${formattedStepDate})`;
        } else if (isTomorrow) {
          timelineLabel = `Tomorrow (${formattedStepDate})`;
        } else {
          timelineLabel = `In ${targetDaysOffset} days (${formattedStepDate})`;
        }
      }

      return {
        ...step,
        timelineLabel
      };
    });

    return {
      priorityScore,
      urgencyLevel,
      explanation,
      estimatedCompletionTime,
      actionSteps: enrichedSteps,
      generatedAt: new Date().toISOString()
    };
  };

  const generateAIPlan = async (task: Task) => {
    setLoading(true);
    setError(null);
    setRetryAttempt(0);
    setRetryMessage(null);
    setCloudAIBusy(false);

    const maxRetries = 3;
    let attempt = 0;
    let success = false;

    while (attempt <= maxRetries && !success) {
      if (attempt > 0) {
        setRetryAttempt(attempt);
        setRetryMessage(`Momentum AI is temporarily busy. Retrying... (Attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      try {
        const response = await fetch("/api/plan-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw { status: response.status, message: errData.error || "HTTP failure" };
        }

        const rawPlan = await response.json();
        
        const plan: AIPlan = {
          ...enrichPlanWithLocalLogic(task, rawPlan.actionSteps),
          cloudAIBusy: rawPlan.cloudAIBusy || false,
          isFallback: rawPlan.isFallback || false
        };
        
        // Update task with the generated plan
        onUpdateTask({
          ...task,
          aiPlan: plan,
        });

        // Update the active selected task in state to reflect the new plan
        onSelectTask({
          ...task,
          aiPlan: plan,
        });
        success = true;
      } catch (err: any) {
        console.warn(`Plan generation attempt ${attempt} failed:`, err);
        attempt++;
      }
    }

    if (!success) {
      console.warn("All cloud generation retries failed. Automatically generating local backup plan.");
      setCloudAIBusy(true);
      await fetchLocalPlanFallback(task);
    } else {
      setLoading(false);
      setRetryAttempt(0);
      setRetryMessage(null);
    }
  };

  const fetchLocalPlanFallback = async (task: Task) => {
    setLoading(true);
    setRetryMessage("Structuring offline backup plan...");
    try {
      const response = await fetch("/api/plan-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, forceFallback: true }),
      });
      if (!response.ok) {
        throw new Error("Local fallback failed");
      }
      const rawPlan = await response.json();
      
      const plan: AIPlan = {
        ...enrichPlanWithLocalLogic(task, rawPlan.actionSteps),
        cloudAIBusy: true,
        isFallback: true
      };
      
      onUpdateTask({ ...task, aiPlan: plan });
      onSelectTask({ ...task, aiPlan: plan });
    } catch (err) {
      generateLocalPlan(task);
    } finally {
      setLoading(false);
      setRetryAttempt(0);
      setRetryMessage(null);
    }
  };

  const generateLocalPlan = (task: Task) => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      let actionSteps: ActionStep[] = [];
      const totalHours = task.estimatedHours;
      
      if (task.category === "Study") {
        actionSteps = [
          { 
            title: "Phase 1: Synthesize & Core Research", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.3)), 
            description: "Review reference materials and draft a detailed content blueprint or key formula summaries." 
          },
          { 
            title: "Phase 2: Draft Primary Output Blocks", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.4)), 
            description: "Write the bulk of the content or execute primary practice/coding tasks in focused study blocks." 
          },
          { 
            title: "Phase 3: Deep Review & Formatting", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.3)), 
            description: "Double check citations, verify guidelines compliance, and polish final formatting details." 
          }
        ];
      } else if (task.category === "Work") {
        actionSteps = [
          { 
            title: "Phase 1: Spec Alignment & Setup", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.25)), 
            description: "Clarify system requirements, configure environment structures, and verify dependencies." 
          },
          { 
            title: "Phase 2: Focused Implementation Sprints", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.5)), 
            description: "Implement the primary logic pathways or construct deliverables in modular intervals." 
          },
          { 
            title: "Phase 3: QA Verification & Testing", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.25)), 
            description: "Run functional audits, clean styling parameters, and secure production sign-off." 
          }
        ];
      } else {
        actionSteps = [
          { 
            title: "Phase 1: Gather Resources & Prep Work", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.3)), 
            description: "Consolidate contacts, materials, and preparatory parameters before beginning active work." 
          },
          { 
            title: "Phase 2: Heavy Lifting execution Block", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.5)), 
            description: "Block out all digital notifications and execute the core steps of your obligation." 
          },
          { 
            title: "Phase 3: Audit & Status Handshake", 
            suggestedHours: Math.max(1, Math.round(totalHours * 0.2)), 
            description: "Confirm completion, update personal storage sheets, and mark status checklist." 
          }
        ];
      }

      const plan: AIPlan = {
        ...enrichPlanWithLocalLogic(task, actionSteps),
        isFallback: true,
        cloudAIBusy: true
      };

      setCloudAIBusy(true);
      onUpdateTask({ ...task, aiPlan: plan });
      onSelectTask({ ...task, aiPlan: plan });
      setLoading(false);
    }, 1200);
  };

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case "High":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getPriorityScoreColor = (score: number) => {
    if (score >= 8) return "text-rose-600 border-rose-200 bg-rose-50";
    if (score >= 5) return "text-amber-600 border-amber-200 bg-amber-50";
    return "text-indigo-600 border-indigo-200 bg-indigo-50";
  };

  // Check if current task has any active plan
  const plan = selectedTask?.aiPlan;

  return (
    <div className="space-y-6" id="ai-planner-container">
      {/* Page Title Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900" id="planner-title">
          Momentum AI Planner
        </h1>
        <p className="text-slate-500 font-medium">
          Transform vague milestones into structured, micro-executable sprints with support from your Gemini productivity coach.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Hand: Task Selection Bar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
              Select Obligation to Plan
            </h2>

            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 stroke-1 mx-auto mb-2" />
                <p className="text-slate-700 font-bold text-sm">All Clean!</p>
                <p className="text-slate-400 text-xs px-4 mt-1">
                  You have no pending obligations to plan. Create one on the Task Catalog page.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {pendingTasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  const hasPlan = !!task.aiPlan;
                  return (
                    <button
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "border-slate-900 bg-slate-50/80 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                              task.category === "Study"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : task.category === "Work"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                          >
                            {task.category}
                          </span>
                          {hasPlan && (
                            <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Sparkles className="h-2 w-2" /> score {task.aiPlan?.priorityScore}
                            </span>
                          )}
                        </div>
                        <p className={`font-bold text-sm truncate ${isSelected ? "text-slate-950" : "text-slate-700"}`}>
                          {task.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-medium">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {task.estimatedHours}h
                          </span>
                          <span>&bull;</span>
                          <span>Due {task.deadline}</span>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isSelected ? "translate-x-1 text-slate-800" : ""}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core App Guidelines (Anti-AIsloop visual reminder) */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-xs text-slate-500 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <Flame className="h-3.5 w-3.5 text-indigo-600" />
              Momentum Coach Advice
            </div>
            <p className="leading-relaxed">
              <strong>Keep tasks crisp:</strong> Gemini plans work best when the headline names a highly specific outcome rather than generic terms. Instead of "Study chemistry", type "Create chemistry summary notes for midterm formula deck".
            </p>
          </div>
        </div>

        {/* Right Hand: Actionable Workspace Plan Details */}
        <div className="lg:col-span-8 space-y-6" id="planner-view-scroll">
          <AnimatePresence mode="wait">
            {!selectedTask ? (
              /* State 1: No Task Selected */
              <motion.div
                key="no-selection"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 text-center py-20 flex flex-col items-center justify-center shadow-sm"
              >
                <Sparkles className="h-12 w-12 text-indigo-400 stroke-1 animate-pulse mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Ready to Orchestrate</h3>
                <p className="text-slate-400 text-sm max-w-sm mt-1.5 mx-auto">
                  Pick any pending obligation from your list on the left. The coach will compile a customized prioritized schedule layout with milestones.
                </p>
              </motion.div>
            ) : loading ? (
              /* State 2: Active Gemini Generation */
              <motion.div
                key="loading-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[450px]"
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 mb-6 border border-slate-700">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  <Sparkles className="absolute right-2 top-2 h-4 w-4 text-amber-400 animate-bounce" />
                </div>

                <span className="font-mono text-xs font-bold uppercase tracking-widest text-indigo-400">
                  {retryAttempt > 0 ? "Temporary Cloud Stress" : "Momentum Analysis Engines Active"}
                </span>
                <h3 className="font-display text-2xl font-bold mt-3">
                  {retryAttempt > 0 ? "Retrying Request" : "Generating Coach Directive"}
                </h3>

                <p className="text-slate-300 text-sm mt-4 max-w-md bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 min-h-[50px] flex items-center justify-center">
                  {retryMessage ? retryMessage : `"${loadingSteps[loadingStep]}"`}
                </p>

                <p className="text-[11px] text-slate-500 mt-8 max-w-xs">
                  We use models/gemini-3.5-flash server-side API proxy variables to safely and securely structure the response layout.
                </p>
              </motion.div>
            ) : error ? (
              /* State 3: API Error State */
              <motion.div
                key="error-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-rose-50 border border-rose-200 text-rose-900 rounded-3xl p-6 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-lg">Planning Engine Halted</h3>
                    <p className="text-rose-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => generateAIPlan(selectedTask)}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin-slow" /> Retry Generation
                  </button>
                  <button
                    onClick={() => generateLocalPlan(selectedTask)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" /> Generate Offline Plan
                  </button>
                  <button
                    onClick={() => onSelectTask(null)}
                    className="text-rose-700 hover:bg-rose-100 text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    Select Another Task
                  </button>
                </div>
              </motion.div>
            ) : !plan ? (
              /* State 4: Task Selected but No Plan Generated Yet */
              <motion.div
                key="trigger-generation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200 rounded-3xl p-8 text-center py-16 flex flex-col items-center justify-center shadow-sm space-y-4"
              >
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">No Action Plan for this Task Yet</h3>
                  <p className="text-slate-500 text-sm max-w-sm mt-1 mx-auto">
                    Let's utilize the Gemini AI framework to prioritze this task and build out actionable blocks.
                  </p>
                </div>

                {/* Micro Metadata summary */}
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                  <span>Category: <strong>{selectedTask.category}</strong></span>
                  <span>Timeline: <strong>{selectedTask.deadline}</strong></span>
                  <span>Est: <strong>{selectedTask.estimatedHours} hours</strong></span>
                </div>

                <button
                  onClick={() => generateAIPlan(selectedTask)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Assemble Action Plan
                </button>
              </motion.div>
            ) : (
              /* State 5: AI Plan Display */
              <motion.div
                key="plan-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Score and Overview Block */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        AI Prioritization Vector
                      </span>
                      <h2 className="font-display text-2xl font-bold text-slate-900 mt-2">
                        {selectedTask.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Priority Score circular shape */}
                      <div className={`h-14 w-14 rounded-2xl border flex flex-col items-center justify-center font-display ${getPriorityScoreColor(plan.priorityScore)}`}>
                        <span className="text-lg font-black leading-none">{plan.priorityScore}</span>
                        <span className="text-[8px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">Priority</span>
                      </div>

                      {/* Urgency Meter */}
                      <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${getUrgencyBadgeColor(plan.urgencyLevel)}`}>
                        {plan.urgencyLevel} Urgency
                      </div>
                    </div>
                  </div>

                  {plan.estimatedCompletionTime && (
                    <div className="mt-4 px-4 py-2.5 bg-emerald-50/60 border border-emerald-100/40 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                      <span>{plan.estimatedCompletionTime}</span>
                    </div>
                  )}

                  {/* Coach Directive / Explanation section */}
                  <div className="mt-6 flex gap-4 items-start bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100/50">
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-indigo-950 text-sm uppercase tracking-wide">
                        Supportive Coach Rationale
                      </h4>
                      <p className="text-indigo-900 text-sm mt-1.5 font-sans leading-relaxed italic">
                        "{plan.explanation}"
                      </p>
                    </div>
                  </div>

                  {plan.isFallback && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <p className="font-bold text-slate-850">
                          {cloudAIBusy ? "Cloud AI is busy. Using Smart Fallback Mode." : "Offline Backup Blueprint Active"}
                        </p>
                        <p className="mt-0.5">
                          {cloudAIBusy
                            ? "We structured this local blueprint using smart defaults so you can keep your momentum without interruption. Feel free to re-assess once cloud engines clear!"
                            : "A local plan was generated while cloud AI is temporarily unavailable. We structured this local blueprint using smart defaults so you can keep your momentum without interruption. Feel free to re-assess once cloud engines clear!"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50 text-[11px] text-slate-400 font-medium">
                    <span>Generated: {new Date(plan.generatedAt).toLocaleString()}</span>
                    <button
                      onClick={() => generateAIPlan(selectedTask)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Re-assess priority
                    </button>
                  </div>
                </div>

                {/* Milestone Roadmap Step Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
                      Interactive Step Blueprint ({plan.actionSteps.length} Milestones)
                    </h3>
                    <span className="text-xs font-mono font-medium text-slate-500">
                      Total work time: {plan.actionSteps.reduce((acc, step) => acc + step.suggestedHours, 0)} hours
                    </span>
                  </div>

                  <div className="space-y-3">
                    {plan.actionSteps.map((step, index) => (
                      <div
                        key={index}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200/80 hover:shadow-md hover:shadow-slate-100/50 transition-all flex items-start gap-4"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <h4 className="font-bold text-slate-800 text-base">
                              {step.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                              {step.timelineLabel && (
                                <span className="bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100/50">
                                  <Calendar className="h-3 w-3 text-indigo-400" /> {step.timelineLabel}
                                </span>
                              )}
                              <span className="bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200/50">
                                <Clock className="h-3 w-3 text-slate-400" /> {step.suggestedHours}h block
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

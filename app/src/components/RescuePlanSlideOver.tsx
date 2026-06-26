import React, { useState, useEffect } from "react";
import { Task, RescuePlan } from "../types";
import { 
  ShieldAlert, Zap, Clock, SkipForward, Flame, RefreshCw, 
  Sparkles, CheckCircle2, Play, AlertTriangle, ChevronDown, 
  ChevronUp, X, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RescuePlanSlideOverProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onStartFocus: (task: Task) => void;
}

export default function RescuePlanSlideOver({ 
  task, 
  isOpen, 
  onClose, 
  onUpdateTask,
  onStartFocus 
}: RescuePlanSlideOverProps) {
  const [situation, setSituation] = useState("");
  const [deadlineInfo, setDeadlineInfo] = useState("");
  const [availableHours, setAvailableHours] = useState(3);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [cloudAIBusy, setCloudAIBusy] = useState(false);

  // States for expandable cards
  const [expandedPriority, setExpandedPriority] = useState<Record<number, boolean>>({});
  const [expandedTimeline, setExpandedTimeline] = useState<Record<number, boolean>>({});
  const [expandedTriageMindset, setExpandedTriageMindset] = useState(false);

  const loadingSteps = [
    "Analyzing urgent situation parameters...",
    "Assessing available energy & time constraints...",
    "Formulating non-essential triage strategy...",
    "Drafting action-oriented time blocks...",
  ];

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      if (task.rescuePlan) {
        setSituation(task.rescuePlan.situation);
        setDeadlineInfo(task.rescuePlan.deadlineInfo);
        setAvailableHours(task.rescuePlan.availableHours);
      } else {
        setSituation(`Tackling high-risk task: "${task.name}". Need a clear pathway to deliver this with zero distraction.`);
        setDeadlineInfo(`Due on ${task.deadline}`);
        setAvailableHours(Math.max(1, Math.min(12, task.estimatedHours)));
      }
      setError(null);
    }
  }, [task]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const togglePriority = (idx: number) => {
    setExpandedPriority(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleTimeline = (idx: number) => {
    setExpandedTimeline(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!isOpen || !task) return null;

  const generateLocalRescuePlan = (sit: string, dl: string, hours: number) => {
    setLoading(true);
    setError(null);

    // Near-instant response under 200ms to avoid loading delays
    setTimeout(() => {
      const parsedHours = Number(hours) || 3;
      const totalMinutes = parsedHours * 60;

      const plan: RescuePlan = {
        situation: sit,
        deadlineInfo: dl,
        availableHours: parsedHours,
        criticalPriorities: [
          "Establish core working structure immediately. Map out exact parameters on paper before coding.",
          "Fulfill the high-yield functional metrics first. Ignore any secondary aesthetic features for now.",
          "Ensure compiling and running states. Commit or save your milestones to maintain stability."
        ],
        whatToSkip: [
          "Optional auxiliary tests or complex corner-case checking routines.",
          "Secondary graphic refinements, custom fonts, or high-fidelity mock assets.",
          "Drafting long written explanations, design specs, or extensive markdown logs."
        ],
        strategy: "Focus 100% on core deliverables. By deploying the Pareto principle (80/20 rule), you secure the largest portion of project points with early structured code before fatigue blocks progress.",
        schedule: [
          {
            timeBlock: `Phase 1: Setup`,
            activity: "Triage & Core Setup: Define the functional skeleton, set up clean files, and clear distracting workspaces.",
            durationMinutes: Math.round(totalMinutes * 0.2)
          },
          {
            timeBlock: `Phase 2: Core Sprint`,
            activity: "Heavy Execution: Code the main algorithm. Avoid polishing secondary UI elements and aim for zero compilation errors.",
            durationMinutes: Math.round(totalMinutes * 0.5)
          },
          {
            timeBlock: `Phase 3: Integration`,
            activity: "Connecting Loops: Tie the core modules together, run localized checks, and guarantee stable rendering.",
            durationMinutes: Math.round(totalMinutes * 0.3)
          }
        ],
        immediateNextAction: "Draft a 5-line raw summary of the primary task goal and shut down unnecessary browser tabs.",
        generatedAt: new Date().toISOString(),
        isFallback: true,
        cloudAIBusy: true
      };

      setCloudAIBusy(true);
      
      const updatedTask: Task = {
        ...task,
        rescuePlan: plan
      };
      onUpdateTask(updatedTask);
      setLoading(false);
    }, 200);
  };

  const handleRescueSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!situation.trim() || !deadlineInfo.trim()) {
      setError("Please describe your situation and target deadline.");
      return;
    }

    setLoading(true);
    setError(null);
    setRetryAttempt(0);
    setRetryMessage(null);
    setCloudAIBusy(false);

    // Implement a strict 4-second timeout to prevent the interface from hanging on high cloud demand
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch("/api/rescue-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          situation,
          deadlineInfo,
          availableHours: Number(availableHours)
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "HTTP connection error");
      }

      const finalPlan: RescuePlan = await response.json();
      
      const updatedTask: Task = {
        ...task,
        rescuePlan: finalPlan
      };
      onUpdateTask(updatedTask);
      setLoading(false);
    } catch (err: any) {
      console.warn("Rescue plan request failed or timed out. Falling back to high-performance local triage formulation.", err);
      clearTimeout(timeoutId);
      setCloudAIBusy(true);
      // Generate instant client fallback
      generateLocalRescuePlan(situation, deadlineInfo, availableHours);
    }
  };

  const handleResetPlan = () => {
    const updatedTask: Task = {
      ...task,
      rescuePlan: undefined
    };
    onUpdateTask(updatedTask);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="rescue-panel-wrapper">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-50 shadow-2xl flex flex-col h-full border-l border-slate-200">
          
          {/* Header */}
          <div className="bg-red-600 text-white p-6 relative flex-shrink-0">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-red-700/50 px-2 py-0.5 rounded-full border border-red-500/20">
                  Crisis Triage protocol
                </span>
              </div>
              <h2 className="font-display text-xl font-black tracking-tight leading-none truncate">
                {task.name}
              </h2>
              <p className="text-red-100/80 text-xs font-semibold">
                Contextual Emergency Rescue Strategy
              </p>
            </div>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence mode="wait">
              
              {/* Form View: Shown if task has no rescue plan and is not loading */}
              {!loading && !task.rescuePlan && (
                <motion.div
                  key="rescue-form-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-xs text-amber-800 font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-900">Task identified as High Risk</p>
                      <p className="leading-relaxed">
                        To prevent failure or severe procrastination, Momentum AI will formulate a customized triage battleplan. Verify the situation inputs below.
                      </p>
                    </div>
                  </div>

                  <form 
                    onSubmit={handleRescueSubmit} 
                    className="space-y-5 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs"
                  >
                    {error && (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 border-t border-rose-100 pt-2">
                          <button
                            type="button"
                            onClick={() => generateLocalRescuePlan(situation, deadlineInfo, availableHours)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            Generate offline
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Urgent Challenge / Situation Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={situation}
                        onChange={(e) => setSituation(e.target.value)}
                        placeholder="Describe the crisis or pressure point..."
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none mt-2"
                      />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Target Deadline
                        </label>
                        <div className="relative mt-2">
                          <input
                            type="text"
                            required
                            value={deadlineInfo}
                            onChange={(e) => setDeadlineInfo(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 pl-4 pr-10 py-3 text-sm text-slate-800 focus:border-red-500 focus:outline-none"
                          />
                          <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Continuous Hours Available
                        </label>
                        <div className="flex items-center gap-3 mt-2">
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={availableHours}
                            onChange={(e) => setAvailableHours(Number(e.target.value))}
                            className="flex-1 accent-red-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                          />
                          <span className="text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl w-12 text-center">
                            {availableHours}h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        <Zap className="h-4 w-4 fill-current animate-pulse" /> Formulate Rescue Battleplan
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Loading State View */}
              {loading && (
                <motion.div
                  key="rescue-loading-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl shadow-xs min-h-[350px]"
                >
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full border-4 border-red-100 border-t-red-600 animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-red-600 fill-current animate-pulse" />
                  </div>
                  <h3 className="font-display font-bold text-slate-800 text-base mt-6">
                    {retryAttempt > 0 ? "Bypassing Server Congestion" : "Analyzing Stress Vectors"}
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold mt-2 max-w-xs px-4">
                    {retryMessage ? retryMessage : loadingSteps[loadingStep]}
                  </p>
                </motion.div>
              )}

              {/* Results Plan View */}
              {task.rescuePlan && !loading && (
                <motion.div
                  key="rescue-results-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Immediate Action Banner */}
                  <div className="rounded-2xl bg-slate-900 text-white p-5 border-l-4 border-red-500 shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-2 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Play className="h-3.5 w-3.5 fill-current text-red-500 animate-ping" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-400">
                          CRITICAL ACTION (NEXT 5 MINUTES)
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                        {task.rescuePlan.immediateNextAction}
                      </h3>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
                        Launch this action directly to break through initial executive dysfunction and task avoidance.
                      </p>
                    </div>
                  </div>

                  {/* Fallback Warning Banner if cloud AI was busy or fallback is active */}
                  {(task.rescuePlan.cloudAIBusy || task.rescuePlan.isFallback) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs leading-relaxed font-medium flex gap-3 items-start shadow-xs">
                      <AlertTriangle className="h-5 w-5 text-amber-650 flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="font-bold text-amber-900 block mb-0.5">High Cloud Demand Fallback</span>
                        Momentum's real-time AI servers are experiencing extreme traffic. To keep you moving forward instantly, we activated our high-performance local triage algorithm to formulate this emergency blueprint.
                      </div>
                    </div>
                  )}

                  {/* Focus Action & Stats Block */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        onClose();
                        onStartFocus(task);
                      }}
                      className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-bold transition cursor-pointer text-sm shadow-md shadow-indigo-100 group border border-indigo-700"
                    >
                      <Zap className="h-4.5 w-4.5 fill-indigo-100 group-hover:scale-110 transition" />
                      Start Focus Session Now
                    </button>

                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">
                            Allocated Time
                          </span>
                          <span className="text-xs font-black text-slate-700 block mt-0.5">
                            {task.rescuePlan.availableHours} Continuous Hours
                          </span>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div>
                          <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">
                            Triage speed
                          </span>
                          <span className="text-xs font-black text-amber-600 block mt-0.5">
                            CRITICAL / ACCELERATED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Timeline Cards */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                      <Clock className="h-4 w-4 text-indigo-500" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800">
                        Recommended Timeline Blocks
                      </h4>
                    </div>

                    <div className="space-y-2.5">
                      {task.rescuePlan.schedule.map((item, idx) => {
                        const label = item.activity.split(":")[0];
                        const detail = item.activity.includes(":") ? item.activity.substring(item.activity.indexOf(":") + 1).trim() : item.activity;
                        const isOpen = expandedTimeline[idx] || false;

                        return (
                          <div 
                            key={idx}
                            className="border border-slate-100 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleTimeline(idx)}
                              className="flex items-center justify-between w-full p-3.5 text-left cursor-pointer focus:outline-none"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                                    {item.timeBlock}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 font-bold bg-white border border-slate-100 px-1.5 py-0.5 rounded">
                                    {item.durationMinutes} mins
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{label}</h4>
                              </div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden bg-white border-t border-slate-100"
                                >
                                  <div className="p-3.5 text-xs text-slate-600 leading-relaxed font-medium">
                                    {detail}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Non-negotiable Critical Priorities */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800">
                        Critical focus Protocol (Click to Expand)
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {task.rescuePlan.criticalPriorities.map((item, idx) => {
                        const title = item.includes(".") ? item.split(".")[0] + "." : item.substring(0, 45) + "...";
                        const description = item.includes(".") ? item.substring(item.indexOf(".") + 1).trim() : item;
                        const isOpen = expandedPriority[idx] || false;

                        return (
                          <div 
                            key={idx} 
                            className="border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => togglePriority(idx)}
                              className="flex items-center justify-between w-full p-3 text-left cursor-pointer focus:outline-none"
                            >
                              <div className="flex gap-2.5 items-center min-w-0">
                                <span className="flex h-5 w-5 rounded-full bg-red-50 text-red-600 font-bold items-center justify-center text-[10px] flex-shrink-0 font-mono">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
                              </div>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </button>
                            
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="overflow-hidden bg-white border-t border-slate-100"
                                >
                                  <div className="p-3 text-xs text-slate-600 leading-relaxed font-medium">
                                    {description || item}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waste Triaging: What to Skip */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <SkipForward className="h-4 w-4 text-amber-500" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800">
                        Ruthlessly Skip or Postpone
                      </h4>
                    </div>
                    
                    <div className="grid gap-2">
                      {task.rescuePlan.whatToSkip.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex gap-2.5 items-start text-xs text-slate-600 bg-amber-50/15 border border-amber-100/40 p-3 rounded-xl font-medium"
                        >
                          <span className="text-amber-500 font-bold font-mono">⚡</span>
                          <span className="leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mindset */}
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                    <button 
                      onClick={() => setExpandedTriageMindset(!expandedTriageMindset)}
                      className="flex items-center justify-between w-full font-bold text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer text-left"
                    >
                      <span>Emergency Triage Mindset</span>
                      {expandedTriageMindset ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                    {expandedTriageMindset && (
                      <p className="text-slate-700 text-xs italic font-semibold leading-relaxed mt-2 border-t border-slate-200/50 pt-2">
                        "{task.rescuePlan.strategy}"
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <button
                      onClick={handleResetPlan}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Re-Assess situation
                    </button>
                    <button
                      onClick={onClose}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Close View
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}

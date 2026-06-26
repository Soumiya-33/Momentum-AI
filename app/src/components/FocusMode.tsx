import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { 
  Play, Pause, RotateCcw, CheckCircle2, Circle, Plus, Trash2, Clock, 
  ChevronRight, Sparkles, Volume2, VolumeX, AlertCircle, Coffee, 
  Moon, CheckSquare, Zap, ZapOff, ArrowLeft, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FocusModeProps {
  tasks: Task[];
  initialSelectedTask: Task | null;
  onToggleStatus: (id: string) => void;
  onBackToDashboard: () => void;
}

interface FocusChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const COACH_TIPS = [
  "Focus on one single micro-task. Multitasking is a myth that drains cognitive energy.",
  "When you feel the urge to check your phone, take a deep breath and give it 5 more minutes.",
  "Your mind is for having ideas, not holding them. Put everything in your checklist.",
  "Perfect is the enemy of done. Get a rough draft down and iterate later.",
  "A 25-minute block of total focus beats 2 hours of distracted, stop-and-start working.",
  "Protect your momentum. Each session builds a buffer against activation fatigue.",
];

export default function FocusMode({ 
  tasks, 
  initialSelectedTask, 
  onToggleStatus,
  onBackToDashboard 
}: FocusModeProps) {
  // Select active task
  const [activeTask, setActiveTask] = useState<Task | null>(initialSelectedTask);
  
  // Available pending tasks to switch to
  const pendingTasks = tasks.filter(t => t.status === "Pending");

  // Timer states
  const [presetTime, setPresetTime] = useState<number>(25 * 60); // 25 minutes default
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionType, setSessionType] = useState<"work" | "break">("work");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Checklist states
  const [checklist, setChecklist] = useState<FocusChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState<string>("");

  // Coach advice index
  const [coachTipIndex, setCoachTipIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load checklist from local storage when active task changes
  useEffect(() => {
    if (activeTask) {
      const stored = localStorage.getItem(`focus-checklist-${activeTask.id}`);
      if (stored) {
        try {
          setChecklist(JSON.parse(stored));
        } catch (e) {
          setChecklist([]);
        }
      } else {
        // Fallback: populate from AI plan if available
        if (activeTask.aiPlan && activeTask.aiPlan.actionSteps) {
          const steps = activeTask.aiPlan.actionSteps.map((step, idx) => ({
            id: `step-${idx}-${Date.now()}`,
            text: step.title,
            completed: false
          }));
          setChecklist(steps);
        } else {
          setChecklist([
            { id: "1", text: "Initial setup & clear distractions", completed: false },
            { id: "2", text: "Core execution of task goal", completed: false },
            { id: "3", text: "Final review & clean up details", completed: false }
          ]);
        }
      }
    } else {
      setChecklist([]);
    }
  }, [activeTask]);

  // Save checklist to localStorage
  const saveChecklist = (items: FocusChecklistItem[]) => {
    setChecklist(items);
    if (activeTask) {
      localStorage.setItem(`focus-checklist-${activeTask.id}`, JSON.stringify(items));
    }
  };

  // Timer tick logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, sessionType]);

  // Adjust tip periodically when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCoachTipIndex((prev) => (prev + 1) % COACH_TIPS.length);
      }, 45000); // 45 seconds
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSessionComplete = () => {
    if (soundEnabled) {
      // Simple synthesizer audio notification using Web Audio API (completely native, safe, self-contained)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Bell sound: High pitch synth tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sine";
        // Frequency sequence for a friendly chime
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (err) {
        console.log("Web Audio not supported or blocked by browser gesture", err);
      }
    }

    // Toggle session type or prompt
    if (sessionType === "work") {
      setSessionType("break");
      setTimeLeft(5 * 60); // 5 minutes short break preset
      setPresetTime(5 * 60);
    } else {
      setSessionType("work");
      setTimeLeft(25 * 60); // 25 minutes default back
      setPresetTime(25 * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(presetTime);
  };

  const handlePresetSelect = (minutes: number, type: "work" | "break") => {
    setIsRunning(false);
    setSessionType(type);
    setPresetTime(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  // Format time beautifully (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Checklist actions
  const toggleChecklistItem = (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveChecklist(updated);
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const newItem: FocusChecklistItem = {
      id: "item-" + Date.now(),
      text: newChecklistItem.trim(),
      completed: false,
    };
    saveChecklist([...checklist, newItem]);
    setNewChecklistItem("");
  };

  const deleteChecklistItem = (id: string) => {
    const filtered = checklist.filter((item) => item.id !== id);
    saveChecklist(filtered);
  };

  // Calculate stats
  const totalItems = checklist.length;
  const completedItems = checklist.filter((i) => i.completed).length;
  const checklistProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Timer circle calculation
  const timerProgress = presetTime > 0 ? ((presetTime - timeLeft) / presetTime) * 100 : 0;

  return (
    <div className="space-y-6" id="focus-mode-container">
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-2">
        <div className="space-y-1">
          <button
            onClick={onBackToDashboard}
            className="group flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            Focus Space
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Immerse yourself in high-impact execution. Eliminate distractions and track milestones.
          </p>
        </div>

        {/* Task Quick-Selector if we want to switch */}
        {pendingTasks.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Task:</span>
            <select
              value={activeTask?.id || ""}
              onChange={(e) => {
                const selected = pendingTasks.find(t => t.id === e.target.value);
                if (selected) {
                  setActiveTask(selected);
                  setIsRunning(false);
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[240px] truncate"
            >
              {!activeTask && <option value="">-- Choose a Task to Focus --</option>}
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeTask ? (
        /* Empty/Selector State */
        <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center justify-center space-y-6">
          <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/50">
            <Zap className="h-8 w-8" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="font-display font-bold text-slate-800 text-lg">No Focus Task Selected</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Focus mode works best when aligned with a specific, logged task. Choose one below or return to the dashboard to begin.
            </p>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="w-full max-w-md space-y-2.5">
              {pendingTasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setActiveTask(task)}
                  className="w-full text-left flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 rounded-2xl transition cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-900">{task.name}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">{task.category} &bull; Est: {task.estimatedHours}h</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
              {pendingTasks.length > 3 && (
                <p className="text-[10px] text-slate-400 font-semibold italic">And {pendingTasks.length - 3} other tasks available in catalog</p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50/50 border border-amber-100/50 text-amber-800 text-xs rounded-2xl max-w-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <span>You don't have any pending tasks. Create a task in the Task Catalog first!</span>
            </div>
          )}

          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Go Back to Dashboard
          </button>
        </div>
      ) : (
        /* Focus Session Active Layout */
        <div className="grid gap-6 md:grid-cols-5">
          {/* Main Focus / Timer Panel */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Ambient Dark Timer Card (Linear-inspired premium UI) */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-900 flex flex-col justify-between min-h-[440px] group">
              {/* Backing Glow / Neon Aura */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none transition duration-500 group-hover:bg-indigo-500/15" />

              {/* Top controls: Sound and Mode status */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${sessionType === "work" ? "bg-indigo-500 animate-pulse" : "bg-emerald-400"}`} />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    {sessionType === "work" ? "DEEP FOCUS ACTIVE" : "BREATHER MODE"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    title={soundEnabled ? "Mute chime" : "Unmute chime"}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Big Interactive Clock Widget */}
              <div className="my-auto flex flex-col items-center justify-center text-center py-6 z-10 select-none">
                {/* Micro Ambient Pulse Ring around Clock */}
                <div className="relative flex items-center justify-center">
                  <AnimatePresence>
                    {isRunning && (
                      <motion.div
                        initial={{ scale: 0.92, opacity: 0.4 }}
                        animate={{ scale: 1.25, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border border-indigo-500/30 w-52 h-52 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center shadow-inner relative">
                    {/* SVG circular progress ring */}
                    <svg className="absolute -rotate-90 w-full h-full p-1 pointer-events-none">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="47%"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="50%"
                        cy="50%"
                        r="47%"
                        fill="none"
                        stroke={sessionType === "work" ? "#6366f1" : "#10b981"}
                        strokeWidth="5"
                        strokeDasharray="295"
                        strokeDashoffset={295 - (295 * timerProgress) / 100}
                        strokeLinecap="round"
                        transition={{ ease: "linear" }}
                      />
                    </svg>

                    <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                      {sessionType === "work" ? <Zap className="h-3 w-3 text-indigo-400 fill-indigo-400" /> : <Coffee className="h-3 w-3 text-emerald-400" />}
                      {sessionType === "work" ? "Deep Work" : "Break"}
                    </span>
                  </div>
                </div>

                {/* Micro adjustment triggers */}
                <div className="flex gap-2.5 mt-5">
                  <button
                    onClick={() => setTimeLeft((prev) => Math.max(60, prev - 60))}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    -1m
                  </button>
                  <button
                    onClick={() => setTimeLeft((prev) => prev + 60)}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    +1m
                  </button>
                </div>
              </div>

              {/* Custom Timer Preset Buttons & Controls */}
              <div className="flex flex-col space-y-4 z-10">
                {/* Presets */}
                <div className="flex justify-center items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => handlePresetSelect(25, "work")}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                      presetTime === 25 * 60 && sessionType === "work"
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    25m Focus
                  </button>
                  <button
                    onClick={() => handlePresetSelect(50, "work")}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                      presetTime === 50 * 60 && sessionType === "work"
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    50m Deep
                  </button>
                  <button
                    onClick={() => handlePresetSelect(5, "break")}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition cursor-pointer ${
                      presetTime === 5 * 60 && sessionType === "break"
                        ? "bg-white/15 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    5m Break
                  </button>
                </div>

                {/* Execution Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTimer}
                    className={`flex-1 py-3.5 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                      isRunning
                        ? "bg-white text-slate-950 hover:bg-slate-100"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/10"
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-4 w-4 stroke-[2.5]" /> Pause Session
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 stroke-[2.5] fill-current" /> Commence Focus
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    title="Reset Timer"
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer border border-white/5"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Task Details & Coach Feedback */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100 uppercase">
                      {activeTask.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Due: {activeTask.deadline}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{activeTask.name}</h3>
                </div>

                <button
                  onClick={() => onToggleStatus(activeTask.id)}
                  className="flex items-center gap-1.5 text-xs font-bold bg-slate-50 border border-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl px-3 py-1.5 transition cursor-pointer self-start"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> Done
                </button>
              </div>

              {/* Coach mini feedback bubble */}
              <div className="flex gap-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/30 items-start">
                <div className="h-7 w-7 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
                  A
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Coach Guidance:</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    "{COACH_TIPS[coachTipIndex]}"
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Side Sub-task Checklist Panel */}
          <div className="md:col-span-2 space-y-6 flex flex-col h-full justify-between">
            
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5 flex-1 flex flex-col min-h-[440px]">
              <div className="space-y-1.5 pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-indigo-600" /> Mini Checklist
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-600 font-bold">
                    {completedItems}/{totalItems} Completed
                  </span>
                </div>
                
                {/* Checklist Progress Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">
                    Clear these sub-goals to build execution momentum.
                  </p>
                </div>
              </div>

              {/* Checklist list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[260px] pr-1 scrollbar-thin">
                {checklist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-1">
                    <Circle className="h-6 w-6 text-slate-200 stroke-1" />
                    <p className="text-slate-400 text-[10px] font-semibold">Your session list is empty.</p>
                    <p className="text-[9px] text-slate-400">Add a few bite-sized chunks to tackle!</p>
                  </div>
                ) : (
                  checklist.map((item) => (
                    <div 
                      key={item.id}
                      className="group flex items-center gap-2.5 bg-slate-50/40 border border-slate-100 rounded-xl p-2.5 hover:bg-slate-50 transition"
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className="text-slate-400 hover:text-indigo-600 transition cursor-pointer flex-shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 group-hover:scale-105 transition" />
                        )}
                      </button>
                      <span className={`text-xs text-slate-700 font-medium flex-1 truncate ${item.completed ? "line-through text-slate-400" : ""}`}>
                        {item.text}
                      </span>
                      <button
                        onClick={() => deleteChecklistItem(item.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item */}
              <form onSubmit={addChecklistItem} className="flex gap-2 pt-2 border-t border-slate-50">
                <input
                  type="text"
                  placeholder="Add a focus sub-step..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
              </form>
            </div>

            {/* Quick Stats Block */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-5 border border-indigo-950 flex justify-between items-center shadow-md">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-widest block">SESSION TARGET</span>
                <p className="text-xs font-bold leading-tight truncate max-w-[150px]">{activeTask.name}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[9px] font-mono text-indigo-300 block">LABOR</span>
                  <span className="text-xs font-black">{activeTask.estimatedHours} Hours</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                  <span className="text-[9px] font-mono text-indigo-300 block">COMPLETED</span>
                  <span className="text-xs font-black">{checklistProgress}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

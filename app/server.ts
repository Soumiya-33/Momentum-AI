import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Shared Gemini client utility with user-agent for telemetry
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Robust Local Fallback Generator for /api/plan-task
  function generateLocalPlan(task: any) {
    const totalHours = Number(task.estimatedHours) || 2;
    const todayStr = new Date().toISOString().split("T")[0];
    const daysLeft = (() => {
      const today = new Date(todayStr);
      const tDate = new Date(task.deadline || todayStr);
      const diffTime = tDate.getTime() - today.getTime();
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    })();

    const workloadRatio = totalHours / daysLeft;
    let urgencyLevel = "Medium";
    let priorityScore = 5;

    if (workloadRatio > 4 || daysLeft <= 1) {
      urgencyLevel = "High";
      priorityScore = Math.min(10, 8 + Math.round(totalHours / 10));
    } else if (workloadRatio < 1.5 && daysLeft > 4) {
      urgencyLevel = "Low";
      priorityScore = Math.max(1, 3 + Math.round(totalHours / 10));
    } else {
      urgencyLevel = "Medium";
      priorityScore = Math.min(9, 5 + Math.round(totalHours / 10));
    }

    const explanation = `Due to heavy traffic on our AI engines, Momentum Coach designed this local blueprint using smart defaults. Optimized for ${task.category || "General"}, we structured ${totalHours} hours into balanced sequential milestones to defeat friction early and safeguard your momentum streak.`;

    let actionSteps = [];
    const cat = task.category || "Study";
    if (cat === "Study") {
      actionSteps = [
        {
          title: "Phase 1: Synthesize & Core Research",
          suggestedHours: Math.max(1, Math.round(totalHours * 0.3)),
          description: "Review your reference materials and draft a detailed content blueprint or key formula summaries."
        },
        {
          title: "Phase 2: Draft Primary Output Blocks",
          suggestedHours: Math.max(1, Math.round(totalHours * 0.5)),
          description: "Write the bulk of the content or execute primary practice/coding tasks in focused study blocks."
        },
        {
          title: "Phase 3: Deep Review & Formatting",
          suggestedHours: Math.max(1, Math.round(totalHours * 0.2)),
          description: "Double check citations, verify guidelines compliance, and polish final formatting details."
        }
      ];
    } else if (cat === "Work") {
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
          title: "Phase 2: Heavy Lifting Execution Block",
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

    return {
      actionSteps,
      isFallback: true,
      generatedAt: new Date().toISOString()
    };
  }

  // Robust Local Fallback Generator for /api/rescue-plan
  function generateLocalRescuePlan(situation: string, deadlineInfo: string, availableHours: number) {
    const totalMinutes = (Number(availableHours) || 3) * 60;

    return {
      situation,
      deadlineInfo,
      availableHours: Number(availableHours) || 3,
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
          timeBlock: "Phase 1: Setup & Triage",
          activity: "Define the functional skeleton, set up clean files, and clear distracting workspaces.",
          durationMinutes: Math.round(totalMinutes * 0.2)
        },
        {
          timeBlock: "Phase 2: Heavy Execution Sprint",
          activity: "Code the main algorithm or execute the primary workflow. Avoid polishing secondary details and aim for zero errors.",
          durationMinutes: Math.round(totalMinutes * 0.5)
        },
        {
          timeBlock: "Phase 3: Integration & Assembly",
          activity: "Connecting Loops: Tie the core modules together, run localized checks, and guarantee stable rendering.",
          durationMinutes: Math.round(totalMinutes * 0.2)
        },
        {
          timeBlock: "Phase 4: Validation & Clear Out",
          activity: "Validation & Hand-off: Run a quick sanity check against instructions, submit the code, and clear memory buffers.",
          durationMinutes: Math.round(totalMinutes * 0.1)
        }
      ],
      immediateNextAction: "Draft a 5-line raw summary of the primary task goal and shut down unnecessary browser tabs.",
      isFallback: true,
      generatedAt: new Date().toISOString()
    };
  }

  // Robust Local Fallback Generator for /api/reflection
  function generateLocalReflection(tasks: any[]) {
    const completedTasks = tasks.filter(t => t.status === "Completed");
    const pendingTasks = tasks.filter(t => t.status === "Pending");
    const todayStr = new Date().toISOString().split("T")[0];
    const delayedTasks = pendingTasks.filter(t => {
      const deadlineDate = new Date(t.deadline);
      const today = new Date(todayStr);
      return deadlineDate < today && t.deadline !== todayStr;
    });

    return {
      dailySummary: `You completed ${completedTasks.length} task${completedTasks.length !== 1 ? "s" : ""} today and are managing ${pendingTasks.length} pending workload items. Focus is steady, but careful pacing is advised for upcoming deadlines.`,
      strengths: [
        `Active engagement: Completed ${completedTasks.length} obligation${completedTasks.length !== 1 ? "s" : ""} securely today.`,
        "Consistent pacing: Maintaining structured categorization across Work and Study segments."
      ],
      areasForImprovement: [
        delayedTasks.length > 0 
          ? `Delayed backlog: ${delayedTasks.length} tasks have crossed their planned deadlines.`
          : "Estimations precision: Optimize block allocation sizes to prevent late sittings."
      ],
      recommendations: [
        "Plan a micro-focus block first thing tomorrow morning to secure your core task.",
        "Use the Emergency Rescue Mode if task stress or deadlines feel overwhelming."
      ],
      tomorrowsFocus: [
        pendingTasks[0]?.name || "Review and update pending task backlog priorities.",
        pendingTasks[1]?.name || "Decongest scheduled priorities and lock in tomorrow's primary objective."
      ],
      isFallback: true,
      generatedAt: new Date().toISOString()
    };
  }

  // API Route: Analyze task and generate an actionable AI Plan
  app.post("/api/plan-task", async (req, res) => {
    const { task, forceFallback } = req.body;
    if (!task) {
      return res.status(400).json({ error: "Task details are required." });
    }

    if (forceFallback) {
      return res.json({
        ...generateLocalPlan(task),
        cloudAIBusy: true
      });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Falling back to local plan generation.");
        return res.json({
          ...generateLocalPlan(task),
          cloudAIBusy: true
        });
      }

      const systemInstruction = `You are Momentum AI, a practical productivity coach.
Generate a concise, sequential step-by-step action plan of exactly 3 phases to complete the given task before its deadline.
Break the task into highly concrete phases (e.g. Phase 1: Research & Outline, Phase 2: Active Implementation, Phase 3: Final Polish).
Divide the task's estimated hours among these steps so they sum up to the task's total estimated hours.`;

      const prompt = `Task: "${task.name}", Category: ${task.category}, Estimated Hours: ${task.estimatedHours}, Deadline: ${task.deadline}`;

      let response;
      let retries = 2;
      let delayMs = 1000;
      while (retries >= 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  actionSteps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: {
                          type: Type.STRING,
                          description: "Visual, concise phase title (e.g., 'Phase 1: Research & Setup')."
                        },
                        suggestedHours: {
                          type: Type.NUMBER,
                          description: "Suggested hours for this specific phase."
                        },
                        description: {
                          type: Type.STRING,
                          description: "Actionable, clear, direct instruction."
                        }
                      },
                      required: ["title", "suggestedHours", "description"]
                    },
                    description: "3 sequential milestones."
                  }
                },
                required: ["actionSteps"]
              }
            }
          });
          break; // Succeeded!
        } catch (apiError: any) {
          const errMsg = apiError.message || "";
          const isTransient = apiError.status === 503 || 
                             apiError.status === 429 || 
                             errMsg.includes("503") || 
                             errMsg.includes("UNAVAILABLE") || 
                             errMsg.includes("demand") ||
                             errMsg.includes("quota") ||
                             errMsg.includes("RESOURCE_EXHAUSTED");
          
          if (retries > 0 && isTransient) {
            console.warn(`Transient Gemini API error. Retrying in ${delayMs}ms... (Retries left: ${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            retries--;
            delayMs *= 2;
          } else {
            throw apiError;
          }
        }
      }

      const responseText = response?.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const planData = JSON.parse(responseText.trim());
      res.json({
        ...planData,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.warn("Error generating AI plan with Gemini. Falling back to local fallback generation. Details:", error.message || error);
      res.json({
        ...generateLocalPlan(task),
        cloudAIBusy: true
      });
    }
  });

  // API Route: Emergency Rescue Plan generator
  app.post("/api/rescue-plan", async (req, res) => {
    const { situation, deadlineInfo, availableHours, forceFallback } = req.body;
    if (!situation || !deadlineInfo || !availableHours) {
      return res.status(400).json({ error: "situation, deadlineInfo, and availableHours are required." });
    }

    if (forceFallback) {
      return res.json({
        ...generateLocalRescuePlan(situation, deadlineInfo, availableHours),
        cloudAIBusy: true
      });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is not configured. Falling back to local rescue plan generation.");
        return res.json({
          ...generateLocalRescuePlan(situation, deadlineInfo, availableHours),
          cloudAIBusy: true
        });
      }

      const systemInstruction = `You are Momentum AI, an ultra-fast emergency productivity coach.
The user is in a state of high stress/overload. Generate a realistic, pragmatic, and highly focused "Emergency Rescue Plan" in JSON format.
To minimize latency and token usage, you MUST be extremely concise and brief:
1. Provide exactly 3 critical priorities (each under 8 words).
2. Provide exactly 3 non-essential items to skip or defer (each under 8 words).
3. The strategy summary must be a single direct sentence (under 12 words).
4. The schedule MUST contain exactly 3 sequential time blocks (e.g. Phase 1: Setup, Phase 2: Core Sprint, Phase 3: Polish). Ensure durationMinutes of these 3 blocks sum up to the user's available time.
5. The immediate next action must be a single quick step (under 8 words) to break procrastination.
Keep descriptions ultra-short to save execution time.`;

      const prompt = `SITUATION DESCRIPTION: "${situation}"
TARGET DEADLINE: "${deadlineInfo}"
AVAILABLE TIME: ${availableHours} hours (${availableHours * 60} minutes)

Generate the Rescue Plan. The 3 schedule blocks must sum up to exactly ${availableHours * 60} minutes.`;

      let response;
      let retries = 1;
      let delayMs = 500;
      while (retries >= 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              maxOutputTokens: 350,
              temperature: 0.2,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  criticalPriorities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 highly critical non-negotiable items."
                  },
                  whatToSkip: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 items to skip to save time."
                  },
                  strategy: {
                    type: Type.STRING,
                    description: "1-sentence summary of the focus strategy."
                  },
                  schedule: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeBlock: {
                          type: Type.STRING,
                          description: "Short label (e.g. 'Phase 1')"
                        },
                        activity: {
                          type: Type.STRING,
                          description: "Action-oriented task description under 10 words."
                        },
                        durationMinutes: {
                          type: Type.INTEGER,
                          description: "Duration in minutes."
                        }
                      },
                      required: ["timeBlock", "activity", "durationMinutes"]
                    },
                    description: "Exactly 3 sequential time blocks."
                  },
                  immediateNextAction: {
                    type: Type.STRING,
                    description: "A single, simple next step under 8 words."
                  }
                },
                required: ["criticalPriorities", "whatToSkip", "strategy", "schedule", "immediateNextAction"]
               }
             }
           });
           break;
         } catch (apiError: any) {
           const errMsg = apiError.message || "";
           const isTransient = apiError.status === 503 ||
                               apiError.status === 429 ||
                               errMsg.includes("503") ||
                               errMsg.includes("UNAVAILABLE") ||
                               errMsg.includes("demand") ||
                               errMsg.includes("quota") ||
                               errMsg.includes("RESOURCE_EXHAUSTED");
           
           if (retries > 0 && isTransient) {
             console.warn(`Transient Gemini API error in rescue route. Retrying in ${delayMs}ms... (Retries left: ${retries})`);
             await new Promise((resolve) => setTimeout(resolve, delayMs));
             retries--;
             delayMs *= 2;
           } else {
             throw apiError;
           }
         }
       }

      const responseText = response?.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API during rescue generation");
      }

      const rescueData = JSON.parse(responseText.trim());
      res.json({
        situation,
        deadlineInfo,
        availableHours: Number(availableHours),
        ...rescueData,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.warn("Error generating AI Rescue Plan with Gemini. Falling back to local rescue plan generation. Details:", error.message || error);
      res.json({
        ...generateLocalRescuePlan(situation, deadlineInfo, availableHours),
        cloudAIBusy: true
      });
    }
  });

  // API Route: AI Reflection generator (fully localized)
  app.post("/api/reflection", async (req, res) => {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "tasks array is required." });
    }

    return res.json(generateLocalReflection(tasks));
  });

  // Serve static assets or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

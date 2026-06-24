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

  // API Route: Analyze task and generate an actionable AI Plan
  app.post("/api/plan-task", async (req, res) => {
    try {
      const { task } = req.body;
      if (!task) {
        return res.status(400).json({ error: "Task details are required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Settings > Secrets panel."
        });
      }

      const systemInstruction = `You are Momentum AI, a supportive, practical, and encouraging productivity coach.
Your job is to analyze tasks for students, professionals, and freelancers to help them avoid missed deadlines through smart task prioritization and actionable planning.
Tone: Professional, encouraging, and practical. Avoid generic motivational quotes. Focus on giving actionable, specific advice.
Analyze the task category (${task.category}), estimated hours (${task.estimatedHours} hours), and deadline (${task.deadline}). The current local time/date is ${new Date().toISOString().split('T')[0]}.
Calculate a Priority Score from 1 to 10 (where 10 is extremely high priority, requiring immediate focus, and 1 is a task that can be scheduled for later).
Assign an Urgency Level (Low, Medium, High).
Provide a concise, encouraging explanation of your analysis.
Generate a practical step-by-step action plan to accomplish the task before the deadline. Break the task into sequential steps with suggested hours that sum up approximately to the task's estimated hours. Ensure the steps are highly concrete (e.g., Research, Draft, Review, Final Touch).`;

      const prompt = `Task Name: "${task.name}"
Category: ${task.category}
Estimated Hours: ${task.estimatedHours}
Deadline: ${task.deadline}

Please analyze this task and generate the prioritized action plan.`;

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
                  priorityScore: {
                    type: Type.INTEGER,
                    description: "Priority score from 1 to 10."
                  },
                  urgencyLevel: {
                    type: Type.STRING,
                    description: "Urgency level: 'Low' | 'Medium' | 'High'."
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "A supportive, professional, practical explanation of the analysis."
                  },
                  actionSteps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: {
                          type: Type.STRING,
                          description: "The visual action-oriented title of this step (e.g., 'Phase 1: Initial Research')."
                        },
                        suggestedHours: {
                          type: Type.NUMBER,
                          description: "Suggested time block in hours for this specific phase."
                        },
                        description: {
                          type: Type.STRING,
                          description: "A clear, actionable guideline for completing this phase."
                        }
                      },
                      required: ["title", "suggestedHours", "description"]
                    },
                    description: "A sequence of actionable chunks or steps."
                  }
                },
                required: ["priorityScore", "urgencyLevel", "explanation", "actionSteps"]
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
                             errMsg.includes("demand");
          
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

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const planData = JSON.parse(responseText.trim());
      res.json({
        ...planData,
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error generating AI plan:", error);
      res.status(500).json({ error: error.message || "Failed to analyze task with Gemini AI." });
    }
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

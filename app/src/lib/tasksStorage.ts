import { Task } from "../types";

const STORAGE_KEY = "momentum_ai_tasks";

const SEED_TASKS: Task[] = [
  {
    id: "seed-1",
    name: "Draft CS201 Machine Learning Proposal",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().split("T")[0];
    })(),
    estimatedHours: 8,
    category: "Study",
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "Refactor API Gateway Endpoints",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString().split("T")[0];
    })(),
    estimatedHours: 12,
    category: "Work",
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    name: "Renew Passport & Health Insurance Documents",
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })(),
    estimatedHours: 4,
    category: "Personal",
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-4",
    name: "Slide Deck for Client Onboarding",
    deadline: new Date().toISOString().split("T")[0], // Due Today!
    estimatedHours: 3,
    category: "Work",
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-5",
    name: "Review React 19 Upgrade Guide",
    deadline: new Date().toISOString().split("T")[0], // Completed Today
    estimatedHours: 2,
    category: "Study",
    status: "Completed",
    createdAt: new Date().toISOString(),
  }
];

export function getLocalTasks(): Task[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TASKS));
    return SEED_TASKS;
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse local tasks, resetting to seeds", err);
    return SEED_TASKS;
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

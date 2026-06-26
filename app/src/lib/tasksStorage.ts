import { Task } from "../types";

const OLD_STORAGE_KEY = "momentum_ai_tasks";
const PRIVATE_STORAGE_KEY = "momentum_ai_private_tasks_v2";

export function getLocalTasks(): Task[] {
  // Check for presence of old demo/seed tasks to automatically clear and migrate
  const oldData = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldData) {
    try {
      const parsedOld: Task[] = JSON.parse(oldData);
      // Filter out all hardcoded/seed tasks so we do not migrate them
      const migratedPrivateTasks = parsedOld.filter(
        (t) => t && t.id && !t.id.startsWith("seed-")
      );
      
      // Save migrated real user tasks to the new storage format key
      localStorage.setItem(PRIVATE_STORAGE_KEY, JSON.stringify(migratedPrivateTasks));
      // Remove old storage key that contained the seed/demo data
      localStorage.removeItem(OLD_STORAGE_KEY);
      
      return migratedPrivateTasks;
    } catch (err) {
      // If corrupted, clear and continue
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
  }

  const data = localStorage.getItem(PRIVATE_STORAGE_KEY);
  if (!data) {
    // New users start with a clean state and empty task list!
    localStorage.setItem(PRIVATE_STORAGE_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const parsed: Task[] = JSON.parse(data);
    // Double-guarantee to filter out any seed tasks that might exist
    return parsed.filter((t) => t && t.id && !t.id.startsWith("seed-"));
  } catch (err) {
    console.error("Failed to parse private local tasks", err);
    return [];
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  // Only save clean non-demo tasks
  const cleanTasks = tasks.filter((t) => t && t.id && !t.id.startsWith("seed-"));
  localStorage.setItem(PRIVATE_STORAGE_KEY, JSON.stringify(cleanTasks));
}


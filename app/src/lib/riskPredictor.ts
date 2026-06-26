import { Task } from "../types";

export interface RiskAnalysis {
  score: number; // 0-100%
  level: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  recommendedAction: string;
}

export function calculateTaskRisk(task: Task, allTasks: Task[]): RiskAnalysis {
  if (task.status === "Completed") {
    return {
      score: 0,
      level: "Low",
      reason: "This obligation has already been completed.",
      recommendedAction: "Great job! Keep tackling other items on your list."
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date(todayStr);
  const deadlineDate = new Date(task.deadline);
  
  // Calculate raw days remaining
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const estHours = task.estimatedHours;
  const activeTasksCount = allTasks.filter(t => t.status === "Pending").length;
  const priorityScore = task.aiPlan?.priorityScore ?? 5; // Default 5

  // 1. Calculate ratio of hours needed to days remaining
  let workloadFactor = 0;
  if (daysLeft === 0) {
    // Due today! Extremely critical if hours are high
    workloadFactor = estHours * 25; // 4 hours due today is 100% risk
  } else {
    // e.g. 8 hours due in 2 days -> 4 hours/day -> 4 * 15 = 60
    const hoursPerDay = estHours / daysLeft;
    workloadFactor = hoursPerDay * 15;
  }

  // 2. Add impact of other competing tasks (concurrency penalty)
  const concurrencyPenalty = Math.min(20, (activeTasksCount - 1) * 3);

  // 3. Add priority impact (higher priority is higher risk of failure if missed)
  const priorityImpact = (priorityScore - 5) * 3;

  // 4. Overdue check
  const isOverdue = deadlineDate.getTime() < today.getTime() && todayStr !== task.deadline;

  // Total raw score
  let score = Math.round(workloadFactor + concurrencyPenalty + priorityImpact);
  if (isOverdue) {
    score = 100;
  } else {
    score = Math.max(5, Math.min(99, score));
  }

  // Determine Level
  let level: "Low" | "Medium" | "High" | "Critical" = "Low";
  if (score >= 85) level = "Critical";
  else if (score >= 60) level = "High";
  else if (score >= 30) level = "Medium";

  // Create elegant dynamic reasons and recommendations
  let reason = "";
  let recommendedAction = "";

  if (isOverdue) {
    reason = `Task is past the scheduled deadline date (${task.deadline}).`;
    recommendedAction = "Immediately reschedule the deadline or complete this task first to resume momentum.";
  } else if (level === "Critical") {
    if (daysLeft === 0) {
      reason = `Due today with a heavy demand of ${estHours} hours while managing ${activeTasksCount} total active obligations.`;
      recommendedAction = "Activate emergency rescue protocols immediately! Postpone non-critical tasks and focus solely on completing this today.";
    } else {
      reason = `Extremely tight timeline. Requires ${estHours} hours of work with only ${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining.`;
      recommendedAction = "Split this work into immediate action blocks. Clear your schedule of distractions today.";
    }
  } else if (level === "High") {
    reason = `High effort task (${estHours} hours) relative to the remaining time (${daysLeft} day${daysLeft > 1 ? "s" : ""}) under a competing load of ${activeTasksCount} tasks.`;
    recommendedAction = "Begin tackling this immediately. Dedicate a continuous 90-minute focus session to secure key milestones.";
  } else if (level === "Medium") {
    reason = `Moderate urgency with ${daysLeft} day${daysLeft > 1 ? "s" : ""} left to finish ${estHours} hours of planned effort.`;
    recommendedAction = "Schedule a clear 1-hour block tomorrow to stay on schedule and prevent risk escalation.";
  } else {
    reason = `Ample time available. You have ${daysLeft} day${daysLeft > 1 ? "s" : ""} to complete ${estHours} hours of work.`;
    recommendedAction = "Maintain healthy pace. Do a small check-in or prep step to keep momentum steady.";
  }

  return {
    score,
    level,
    reason,
    recommendedAction
  };
}

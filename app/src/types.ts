export interface Task {
  id: string;
  name: string;
  deadline: string; // format YYYY-MM-DD
  estimatedHours: number;
  category: 'Study' | 'Work' | 'Personal';
  status: 'Pending' | 'Completed';
  createdAt: string;
  aiPlan?: AIPlan;
  rescuePlan?: RescuePlan;
}

export interface AIPlan {
  priorityScore: number; // 1-10
  urgencyLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
  actionSteps: ActionStep[];
  generatedAt: string;
  isFallback?: boolean;
  cloudAIBusy?: boolean;
  estimatedCompletionTime?: string;
}

export interface ActionStep {
  title: string;
  suggestedHours: number;
  description: string;
  timelineLabel?: string;
}

export interface RescuePlan {
  situation: string;
  deadlineInfo: string;
  availableHours: number;
  criticalPriorities: string[];
  whatToSkip: string[];
  strategy: string;
  schedule: RescueScheduleItem[];
  immediateNextAction: string;
  generatedAt: string;
  isFallback?: boolean;
  cloudAIBusy?: boolean;
}

export interface RescueScheduleItem {
  timeBlock: string; // e.g. "Hour 1: Focus" or "14:00 - 15:30"
  activity: string;
  durationMinutes: number;
}

export interface AIReflectionData {
  dailySummary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  tomorrowsFocus: string[];
  generatedAt: string;
  isFallback?: boolean;
}


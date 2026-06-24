export interface Task {
  id: string;
  name: string;
  deadline: string; // format YYYY-MM-DD
  estimatedHours: number;
  category: 'Study' | 'Work' | 'Personal';
  status: 'Pending' | 'Completed';
  createdAt: string;
  aiPlan?: AIPlan;
}

export interface AIPlan {
  priorityScore: number; // 1-10
  urgencyLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
  actionSteps: ActionStep[];
  generatedAt: string;
  isFallback?: boolean;
}

export interface ActionStep {
  title: string;
  suggestedHours: number;
  description: string;
}

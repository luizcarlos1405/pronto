import type { GoalDoc, TaskDoc, GoalStatus } from '$lib/types';

export function calculateGoalStatus(goal: GoalDoc, tasks: TaskDoc[]): GoalStatus {
  if (tasks.length === 0) return 'NOT_STARTED';

  const allDone = tasks.every((t) => t.status === 'DONE');
  if (allDone) return 'REVIEW';

  return 'IN_PROGRESS';
}

export function filterToTopTaskPerGoal(tasks: TaskDoc[]): TaskDoc[] {
  const topPerGoal = new Map<string, TaskDoc>();

  for (const task of tasks) {
    if (!task.goalId) continue;
    const existing = topPerGoal.get(task.goalId);
    if (!existing || (task.stepOrder ?? Infinity) < (existing.stepOrder ?? Infinity)) {
      topPerGoal.set(task.goalId, task);
    }
  }

  return tasks.filter((task) => {
    if (!task.goalId) return true;
    return topPerGoal.get(task.goalId)?._id === task._id;
  });
}

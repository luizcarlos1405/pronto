import type { GoalDoc, TaskDoc, GoalStatus } from '$lib/types';

export function calculateGoalStatus(goal: GoalDoc, tasks: TaskDoc[]): GoalStatus {
	if (tasks.length === 0) return 'NOT_STARTED';

	const allDone = tasks.every((t) => t.status === 'DONE');
	if (allDone) return 'REVIEW';

	return 'IN_PROGRESS';
}

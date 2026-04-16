import type { ObjectiveDoc, TaskDoc, ObjectiveStatus } from '$lib/types';

export function calculateObjectiveStatus(
	objective: ObjectiveDoc,
	tasks: TaskDoc[]
): ObjectiveStatus {
	if (objective.status === 'COMPLETED') return 'COMPLETED';

	if (tasks.length === 0) return 'NOT_STARTED';

	const allDone = tasks.every((t) => t.status === 'DONE');
	if (allDone) return 'REVIEW';

	return 'IN_PROGRESS';
}

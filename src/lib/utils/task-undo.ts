import { restoreTask } from '$lib/db/task-repo';
import type { TaskDoc } from '$lib/types';

export function snapshotTask(task: TaskDoc): TaskDoc {
  return { ...task };
}

export async function undoDeleteTask(snapshot: TaskDoc): Promise<TaskDoc> {
  return restoreTask(snapshot);
}

import type { TaskDoc } from '$lib/types';

export function snapshotTask(task: TaskDoc): TaskDoc {
  return { ...task };
}

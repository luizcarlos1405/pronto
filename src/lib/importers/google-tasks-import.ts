import { Temporal } from '@js-temporal/polyfill';
import { isValidGoogleTasksExport, parseGoogleTasksExport } from './google-tasks';
import { createCare } from '$lib/db/care-repo';
import { createTask } from '$lib/db/task-repo';

export interface GoogleTasksImportResult {
  cares: number;
  tasks: number;
}

export class InvalidGoogleTasksFileError extends Error {
  constructor() {
    super("This isn't a Google Tasks export file");
  }
}

export async function importGoogleTasksFromFile(file: File): Promise<GoogleTasksImportResult> {
  const text = await file.text();
  const json = JSON.parse(text);

  if (!isValidGoogleTasksExport(json)) {
    throw new InvalidGoogleTasksFileError();
  }

  const todayIso = Temporal.Now.plainDateISO().toString();
  const parsed = parseGoogleTasksExport(json, todayIso);

  for (const care of parsed.cares) {
    await createCare(care.title, care.taskPlans);
  }

  for (const task of parsed.tasks) {
    await createTask({
      title: task.title,
      doAt: task.doAt
    });
  }

  return { cares: parsed.cares.length, tasks: parsed.tasks.length };
}

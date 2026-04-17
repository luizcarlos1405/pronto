import type { Recurrence, TaskPlan } from '$lib/types';

export interface GoogleInterval {
  daily?: Record<string, unknown>;
  weekly?: { days_of_week?: number[] };
  monthly?: { day_of_month?: number };
  yearly?: { date_of_year?: { month: number; day: number } };
  interval_multiplier: number;
}

export interface GoogleSchedule {
  first_instance_date: string;
  interval: GoogleInterval;
  end_condition?: { date_boundary: string };
  time_zone: string;
}

export interface GoogleRecurrence {
  id: string;
  title: string;
  schedule: GoogleSchedule;
  external_reference_task_id?: string;
}

export interface GoogleScheduledTime {
  current: boolean;
  start: string;
}

export interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  completed?: string;
  notes?: string;
  scheduled_time?: GoogleScheduledTime[];
  task_recurrence_id?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  recurrences?: GoogleRecurrence[];
  items: GoogleTask[];
}

export interface GoogleTasksExport {
  kind: string;
  items: GoogleTaskList[];
}

export function isValidGoogleTasksExport(data: unknown): data is GoogleTasksExport {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as GoogleTasksExport).kind === 'tasks#taskLists' &&
    Array.isArray((data as GoogleTasksExport).items)
  );
}

function isRecurrenceEnded(schedule: GoogleSchedule, todayIso: string): boolean {
  if (!schedule.end_condition?.date_boundary) return false;
  return schedule.end_condition.date_boundary.slice(0, 10) < todayIso;
}

export function translateSchedule(recurrence: GoogleRecurrence): Recurrence | null {
  const { schedule, title: _title } = recurrence;
  const startDate = schedule.first_instance_date.slice(0, 10);
  const interval = schedule.interval;
  const multiplier = interval.interval_multiplier;

  if (interval.yearly?.date_of_year) {
    const { month, day } = interval.yearly.date_of_year;
    if (multiplier === 1) {
      return {
        type: 'FIXED_DAYS',
        subtype: 'YEARDAYS',
        dates: [{ month, day }],
        startDate
      };
    }
    return {
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { years: multiplier },
      startDate
    };
  }

  if (interval.monthly?.day_of_month !== undefined) {
    if (multiplier === 1) {
      return {
        type: 'FIXED_DAYS',
        subtype: 'MONTHDAYS',
        daysOfMonth: [interval.monthly.day_of_month],
        startDate
      };
    }
    return {
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { months: multiplier },
      startDate
    };
  }

  if (interval.weekly) {
    if (interval.weekly.days_of_week && interval.weekly.days_of_week.length > 0) {
      return {
        type: 'FIXED_DAYS',
        subtype: 'WEEKDAYS',
        daysOfWeek: interval.weekly.days_of_week,
        startDate
      };
    }
    return {
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { weeks: multiplier },
      startDate
    };
  }

  if (interval.daily !== undefined) {
    return {
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: multiplier },
      startDate
    };
  }

  return null;
}

function isOpenTask(task: GoogleTask): boolean {
  return task.status === 'needsAction' && !task.task_recurrence_id;
}

function getDoAt(task: GoogleTask, todayIso: string): string {
  if (task.scheduled_time?.[0]?.start) {
    return task.scheduled_time[0].start.slice(0, 10);
  }
  return todayIso;
}

export interface ParsedImportResult {
  cares: Array<{
    title: string;
    taskPlans: Omit<TaskPlan, '_id' | 'createdAt' | 'updatedAt'>[];
  }>;
  tasks: Array<{
    title: string;
    doAt: string;
  }>;
}

export function parseGoogleTasksExport(
  json: GoogleTasksExport,
  todayIso: string
): ParsedImportResult {
  const result: ParsedImportResult = { cares: [], tasks: [] };

  for (const list of json.items) {
    const activeRecurrences = (list.recurrences ?? []).filter(
      (r) => !isRecurrenceEnded(r.schedule, todayIso) && translateSchedule(r) !== null
    );

    const openTasks = list.items.filter(isOpenTask);

    if (activeRecurrences.length > 0) {
      const taskPlans: Omit<TaskPlan, '_id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const rec of activeRecurrences) {
        const recurrence = translateSchedule(rec)!;
        taskPlans.push({
          title: rec.title,
          recurrence
        });
      }

      result.cares.push({
        title: list.title,
        taskPlans
      });

      for (const task of openTasks) {
        result.tasks.push({
          title: task.title,
          doAt: getDoAt(task, todayIso)
        });
      }
    } else {
      for (const task of openTasks) {
        result.tasks.push({
          title: task.title,
          doAt: getDoAt(task, todayIso)
        });
      }
    }
  }

  return result;
}

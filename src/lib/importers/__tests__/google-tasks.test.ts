import { describe, it, expect } from 'vitest';
import {
  isValidGoogleTasksExport,
  translateSchedule,
  parseGoogleTasksExport,
  type GoogleTasksExport,
  type GoogleRecurrence,
  type GoogleTaskList,
  type GoogleTask,
} from '../google-tasks';

function makeRecurrence(
  overrides: Partial<GoogleRecurrence> & { schedule: GoogleRecurrence['schedule'] },
): GoogleRecurrence {
  return {
    id: 'rec_1',
    title: 'Test recurrence',
    ...overrides,
  };
}

function makeTask(overrides: Partial<GoogleTask>): GoogleTask {
  return {
    id: 'task_1',
    title: 'Test task',
    status: 'needsAction',
    ...overrides,
  };
}

function makeList(overrides: Partial<GoogleTaskList>): GoogleTaskList {
  return {
    id: 'list_1',
    title: 'Test list',
    items: [],
    ...overrides,
  };
}

describe('isValidGoogleTasksExport', () => {
  it('returns true for valid Google Tasks export', () => {
    const data = { kind: 'tasks#taskLists', items: [] };
    expect(isValidGoogleTasksExport(data)).toBe(true);
  });

  it('returns false for non-Google Tasks JSON', () => {
    expect(isValidGoogleTasksExport({ app: 'faz', docs: [] })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidGoogleTasksExport(null)).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(isValidGoogleTasksExport({ kind: 'tasks#taskLists', items: {} })).toBe(false);
  });
});

describe('translateSchedule', () => {
  it('translates daily interval to INTERVAL/FIXED with days', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-01T00:00:00Z',
        interval: { daily: {}, interval_multiplier: 3 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 3 },
      startDate: '2026-01-01',
    });
  });

  it('translates daily with multiplier 7 to INTERVAL/FIXED with days', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-16T00:00:00Z',
        interval: { daily: {}, interval_multiplier: 7 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 7 },
      startDate: '2026-01-16',
    });
  });

  it('translates monthly with multiplier 1 to FIXED_DAYS/MONTHDAYS', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-03-04T00:00:00Z',
        interval: { monthly: { day_of_month: 4 }, interval_multiplier: 1 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [4],
      startDate: '2026-03-04',
    });
  });

  it('translates monthly with multiplier > 1 to INTERVAL/FIXED with months', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-04T00:00:00Z',
        interval: { monthly: { day_of_month: 4 }, interval_multiplier: 3 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { months: 3 },
      startDate: '2026-01-04',
    });
  });

  it('translates yearly with multiplier 1 to FIXED_DAYS/YEARDAYS', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2025-01-01T00:00:00Z',
        interval: {
          yearly: { date_of_year: { month: 1, day: 1 } },
          interval_multiplier: 1,
        },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'FIXED_DAYS',
      subtype: 'YEARDAYS',
      dates: [{ month: 1, day: 1 }],
      startDate: '2025-01-01',
    });
  });

  it('translates yearly with multiplier > 1 to INTERVAL/FIXED with years', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2025-01-01T00:00:00Z',
        interval: {
          yearly: { date_of_year: { month: 7, day: 1 } },
          interval_multiplier: 2,
        },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { years: 2 },
      startDate: '2025-01-01',
    });
  });

  it('translates weekly with days_of_week to FIXED_DAYS/WEEKDAYS', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-05T00:00:00Z',
        interval: { weekly: { days_of_week: [1, 3, 5] }, interval_multiplier: 1 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'FIXED_DAYS',
      subtype: 'WEEKDAYS',
      daysOfWeek: [1, 3, 5],
      startDate: '2026-01-05',
    });
  });

  it('translates weekly without days_of_week to INTERVAL/FIXED with weeks', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-05T00:00:00Z',
        interval: { weekly: {}, interval_multiplier: 2 },
        time_zone: 'America/Campo_Grande',
      },
    });
    const result = translateSchedule(rec)!;
    expect(result).toEqual({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { weeks: 2 },
      startDate: '2026-01-05',
    });
  });

  it('returns null for unrecognized interval', () => {
    const rec = makeRecurrence({
      schedule: {
        first_instance_date: '2026-01-01T00:00:00Z',
        interval: { interval_multiplier: 1 } as any,
        time_zone: 'America/Campo_Grande',
      },
    });
    expect(translateSchedule(rec)).toBeNull();
  });
});

describe('parseGoogleTasksExport', () => {
  const today = '2026-04-17';

  it('creates regular tasks for lists without recurrences', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'My list',
          items: [
            makeTask({ title: 'Task A' }),
            makeTask({ title: 'Task B', status: 'completed', completed: '2026-01-01T00:00:00Z' }),
          ],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(0);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Task A');
    expect(result.tasks[0].doAt).toBe(today);
  });

  it('creates a care for lists with active recurrences', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'Carro',
          recurrences: [
            makeRecurrence({
              title: 'Lava Jato',
              schedule: {
                first_instance_date: '2026-01-16T00:00:00Z',
                interval: { daily: {}, interval_multiplier: 7 },
                time_zone: 'America/Campo_Grande',
              },
            }),
          ],
          items: [makeTask({ title: 'Open task' })],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(1);
    expect(result.cares[0].title).toBe('Carro');
    expect(result.cares[0].taskPlans).toHaveLength(1);
    expect(result.cares[0].taskPlans[0].title).toBe('Lava Jato');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Open task');
  });

  it('skips completed tasks', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          items: [
            makeTask({ status: 'completed', completed: '2026-01-01T00:00:00Z' }),
            makeTask({ status: 'needsAction' }),
          ],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.tasks).toHaveLength(1);
  });

  it('skips recurrence instances (tasks with task_recurrence_id)', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          items: [
            makeTask({ task_recurrence_id: 'rec_1' }),
            makeTask({ title: 'Standalone task' }),
          ],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Standalone task');
  });

  it('skips ended recurrences', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'Ended list',
          recurrences: [
            makeRecurrence({
              title: 'Old recurrence',
              schedule: {
                first_instance_date: '2025-01-01T00:00:00Z',
                interval: { daily: {}, interval_multiplier: 1 },
                end_condition: { date_boundary: '2026-01-24T00:00:00Z' },
                time_zone: 'America/Campo_Grande',
              },
            }),
          ],
          items: [makeTask({ title: 'Remaining task' })],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(0);
    expect(result.tasks).toHaveLength(1);
  });

  it('keeps active recurrence when end_boundary is in the future', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'Active list',
          recurrences: [
            makeRecurrence({
              title: 'Future recurrence',
              schedule: {
                first_instance_date: '2026-01-01T00:00:00Z',
                interval: { monthly: { day_of_month: 5 }, interval_multiplier: 1 },
                end_condition: { date_boundary: '2027-01-01T00:00:00Z' },
                time_zone: 'America/Campo_Grande',
              },
            }),
          ],
          items: [],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(1);
    expect(result.cares[0].taskPlans).toHaveLength(1);
  });

  it('uses scheduled_time start as doAt', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          items: [
            makeTask({
              title: 'Scheduled',
              scheduled_time: [{ current: true, start: '2026-03-12T04:00:00Z' }],
            }),
          ],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.tasks[0].doAt).toBe('2026-03-12');
  });

  it('uses today as doAt when no scheduled_time', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          items: [makeTask({ title: 'Unscheduled' })],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.tasks[0].doAt).toBe(today);
  });

  it('handles empty lists', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [makeList({ items: [] })],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(0);
    expect(result.tasks).toHaveLength(0);
  });

  it('handles multiple lists', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'List A',
          recurrences: [
            makeRecurrence({
              title: 'Recurrence A',
              schedule: {
                first_instance_date: '2026-01-01T00:00:00Z',
                interval: { daily: {}, interval_multiplier: 1 },
                time_zone: 'UTC',
              },
            }),
          ],
          items: [makeTask({ title: 'Task A1' })],
        }),
        makeList({
          title: 'List B',
          items: [makeTask({ title: 'Task B1' }), makeTask({ title: 'Task B2' })],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(1);
    expect(result.cares[0].title).toBe('List A');
    expect(result.tasks).toHaveLength(3);
    expect(result.tasks.map((t) => t.title)).toEqual(['Task A1', 'Task B1', 'Task B2']);
  });

  it('creates care with multiple task plans', () => {
    const json: GoogleTasksExport = {
      kind: 'tasks#taskLists',
      items: [
        makeList({
          title: 'Contas',
          recurrences: [
            makeRecurrence({
              id: 'r1',
              title: 'Internet',
              schedule: {
                first_instance_date: '2026-01-05T00:00:00Z',
                interval: { monthly: { day_of_month: 5 }, interval_multiplier: 1 },
                time_zone: 'America/Campo_Grande',
              },
            }),
            makeRecurrence({
              id: 'r2',
              title: 'Unimed',
              schedule: {
                first_instance_date: '2026-01-05T00:00:00Z',
                interval: { monthly: { day_of_month: 5 }, interval_multiplier: 1 },
                time_zone: 'America/Campo_Grande',
              },
            }),
          ],
          items: [makeTask({ title: 'Non-recurrent task' })],
        }),
      ],
    };
    const result = parseGoogleTasksExport(json, today);
    expect(result.cares).toHaveLength(1);
    expect(result.cares[0].taskPlans).toHaveLength(2);
    expect(result.cares[0].taskPlans[0].title).toBe('Internet');
    expect(result.cares[0].taskPlans[1].title).toBe('Unimed');
  });
});

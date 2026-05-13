import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  evaluateIntervalFixed,
  evaluateIntervalAfterDone,
  evaluateFixedDays,
  evaluateTaskPlan,
  runScheduler,
} from '../care-engine';
import { filterToTopTaskPerGoal } from '../goal-engine';
import type { TaskPlan, TaskDoc, CareDoc } from '$lib/types';

function makePlan(
  overrides: Partial<TaskPlan['recurrence']> & { type: TaskPlan['recurrence']['type'] },
): TaskPlan {
  const base: TaskPlan = {
    _id: 'tp_test',
    title: 'Test Task',
    recurrence: overrides as TaskPlan['recurrence'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  return base;
}

function makeTask(overrides: Partial<TaskDoc>): TaskDoc {
  return {
    _id: 'task_1',
    type: 'Task',
    title: 'T',
    doAt: '2026-01-01',
    status: 'TODO',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('evaluateIntervalFixed', () => {
  it('generates task at startDate when no lastDoAtDate and startDate is today', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 7 },
      startDate: '2026-01-15',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = evaluateIntervalFixed(plan, today);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-01-15');
  });

  it('advances past missed intervals', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 7 },
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-20');
    const result = evaluateIntervalFixed(plan, today);
    expect(result!.doAt).toBe('2026-01-22');
  });

  it('uses lastDoAtDate as anchor when present', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 7 },
      startDate: '2026-01-01',
    });
    plan.lastDoAtDate = '2026-01-15';
    const today = Temporal.PlainDate.from('2026-01-22');
    const result = evaluateIntervalFixed(plan, today);
    expect(result!.doAt).toBe('2026-01-22');
  });

  it('generates future task when anchor + interval is in the future', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { months: 1 },
      startDate: '2026-01-15',
    });
    const today = Temporal.PlainDate.from('2026-01-10');
    const result = evaluateIntervalFixed(plan, today);
    expect(result!.doAt).toBe('2026-01-15');
  });
});

describe('evaluateIntervalAfterDone', () => {
  it('returns null when an active TODO task exists', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-10');
    const existing = [makeTask({ taskPlanId: 'tp_test', status: 'TODO' })];
    const result = evaluateIntervalAfterDone(plan, today, existing);
    expect(result).toBeNull();
  });

  it('uses lastDoneDate as anchor when present', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-01',
    });
    plan.lastDoneDate = '2026-01-10';
    const today = Temporal.PlainDate.from('2026-01-13');
    const result = evaluateIntervalAfterDone(plan, today, []);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-01-13');
  });

  it('falls back to startDate when no lastDoneDate', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-10',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = evaluateIntervalAfterDone(plan, today, []);
    expect(result!.doAt).toBe('2026-01-10');
  });

  it('returns null when all existing tasks are DONE (no active)', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-01',
    });
    plan.lastDoneDate = '2026-01-05';
    const today = Temporal.PlainDate.from('2026-01-08');
    const existing = [makeTask({ taskPlanId: 'tp_test', status: 'DONE' })];
    const result = evaluateIntervalAfterDone(plan, today, existing);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-01-08');
  });

  it('uses lastDoneDate + interval, not startDate, after task completion', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 4 },
      startDate: '2026-04-20',
    });
    plan.lastDoneDate = '2026-05-12';
    const today = Temporal.PlainDate.from('2026-05-12');
    const existing = [makeTask({ taskPlanId: 'tp_test', status: 'DONE' })];
    const result = evaluateIntervalAfterDone(plan, today, existing);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-05-16');
  });

  it('does not reuse startDate when lastDoneDate is set and far ahead', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 4 },
      startDate: '2026-04-20',
    });
    plan.lastDoneDate = '2026-05-12';
    const today = Temporal.PlainDate.from('2026-05-20');
    const result = evaluateIntervalAfterDone(plan, today, []);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-05-16');
  });
});

describe('evaluateFixedDays', () => {
  it('generates tasks for WEEKDAYS', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'WEEKDAYS',
      daysOfWeek: [1, 5],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-12');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(2);
    const doAts = result.map((t) => t.doAt).sort();
    expect(doAts[0]).toBe('2026-01-12');
    expect(doAts[1]).toBe('2026-01-16');
  });

  it('generates tasks for MONTHDAYS', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [1, 15],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-10');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(2);
    const doAts = result.map((t) => t.doAt).sort();
    expect(doAts[0]).toBe('2026-01-15');
    expect(doAts[1]).toBe('2026-02-01');
  });

  it('clamps day 31 to month length for February', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [31],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-02-01');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2026-02-28');
  });

  it('generates tasks for YEARDAYS', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'YEARDAYS',
      dates: [
        { month: 12, day: 25 },
        { month: 7, day: 4 },
      ],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-06-01');
    const result = evaluateFixedDays(plan, today, []);
    const doAts = result.map((t) => t.doAt).sort();
    expect(doAts).toContain('2026-07-04');
    expect(doAts).toContain('2026-12-25');
  });

  it('skips dates where a task already exists', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [1],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-01');
    const existing = [makeTask({ taskPlanId: 'tp_test', doAt: '2026-01-01' })];
    const result = evaluateFixedDays(plan, today, existing);
    expect(result.length).toBe(0);
  });

  it('respects startDate as minimum', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'WEEKDAYS',
      daysOfWeek: [1],
      startDate: '2026-01-15',
    });
    const today = Temporal.PlainDate.from('2026-01-05');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(
      Temporal.PlainDate.compare(
        Temporal.PlainDate.from(result[0].doAt),
        Temporal.PlainDate.from('2026-01-15'),
      ) >= 0,
    ).toBe(true);
  });
});

describe('evaluateTaskPlan', () => {
  it('dispatches to evaluateIntervalFixed', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 7 },
      startDate: '2026-01-15',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = evaluateTaskPlan(plan, today, []);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-01-15');
  });

  it('dispatches to evaluateIntervalAfterDone', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-10',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = evaluateTaskPlan(plan, today, []);
    expect(result).not.toBeNull();
    expect(result!.doAt).toBe('2026-01-10');
  });

  it('dispatches to evaluateFixedDays', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'WEEKDAYS',
      daysOfWeek: [1],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-12');
    const result = evaluateTaskPlan(plan, today, []);
    expect(result).not.toBeNull();
  });
});

describe('runScheduler', () => {
  it('generates a task for today when a new plan starts today', () => {
    const plan: TaskPlan = {
      _id: 'tp_new',
      title: 'Daily standup',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 1 },
        startDate: '2026-01-15',
      },
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };
    const care: CareDoc = {
      _id: 'care_1',
      type: 'Care',
      title: 'Work',
      taskPlans: [plan],
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = runScheduler([care], today, () => []);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].doAt).toBe('2026-01-15');
    expect(result.tasks[0].status).toBe('TODO');
    expect(result.tasks[0].taskPlanId).toBe('tp_new');
    expect(result.tasks[0].careId).toBe('care_1');

    const visible = filterToTopTaskPerGoal(result.tasks);
    expect(visible).toHaveLength(1);
    expect(visible[0]._id).toBe(result.tasks[0]._id);
  });

  it('generates a task for today with FIXED_DAYS/WEEKDAYS when today matches', () => {
    const plan: TaskPlan = {
      _id: 'tp_weekly',
      title: 'Grocery shopping',
      recurrence: {
        type: 'FIXED_DAYS',
        subtype: 'WEEKDAYS',
        daysOfWeek: [1],
        startDate: '2026-01-01',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care: CareDoc = {
      _id: 'care_2',
      type: 'Care',
      title: 'Home',
      taskPlans: [plan],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-12');
    const result = runScheduler([care], today, () => []);

    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].doAt).toBe('2026-01-12');
    expect(result.tasks[0].status).toBe('TODO');

    const visible = filterToTopTaskPerGoal(result.tasks);
    expect(visible).toHaveLength(1);
  });

  it('sets careId on generated tasks', () => {
    const plan: TaskPlan = {
      _id: 'tp_1',
      title: 'Water plants',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 7 },
        startDate: '2026-01-15',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care: CareDoc = {
      _id: 'care_1',
      type: 'Care',
      title: 'Plants',
      taskPlans: [plan],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = runScheduler([care], today, () => []);
    expect(result.tasks.length).toBe(1);
    expect(result.tasks[0].careId).toBe('care_1');
  });

  it('handles multiple cares with multiple plans', () => {
    const planA: TaskPlan = {
      _id: 'tp_a',
      title: 'Task A',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 1 },
        startDate: '2026-01-15',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const planB: TaskPlan = {
      _id: 'tp_b',
      title: 'Task B',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 7 },
        startDate: '2026-01-15',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care1: CareDoc = {
      _id: 'care_1',
      type: 'Care',
      title: 'Work',
      taskPlans: [planA],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care2: CareDoc = {
      _id: 'care_2',
      type: 'Care',
      title: 'Home',
      taskPlans: [planB],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = runScheduler([care1, care2], today, () => []);
    expect(result.tasks.length).toBe(2);
    expect(result.tasks.find((t) => t.careId === 'care_1')).toBeDefined();
    expect(result.tasks.find((t) => t.careId === 'care_2')).toBeDefined();
  });

  it('returns empty when all plans have active TODO tasks (AFTER_DONE)', () => {
    const plan: TaskPlan = {
      _id: 'tp_ad',
      title: 'Recurring',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'AFTER_DONE',
        interval: { days: 3 },
        startDate: '2026-01-01',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care: CareDoc = {
      _id: 'care_1',
      type: 'Care',
      title: 'Test',
      taskPlans: [plan],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-10');
    const result = runScheduler([care], today, () => [
      makeTask({ taskPlanId: 'tp_ad', status: 'TODO' }),
    ]);
    expect(result.tasks.length).toBe(0);
    expect(result.updatedPlans.size).toBe(0);
  });

  it('tracks lastDoAtDate in updatedPlans for INTERVAL/FIXED', () => {
    const plan: TaskPlan = {
      _id: 'tp_fixed',
      title: 'Weekly',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 7 },
        startDate: '2026-01-15',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const care: CareDoc = {
      _id: 'care_1',
      type: 'Care',
      title: 'Test',
      taskPlans: [plan],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const today = Temporal.PlainDate.from('2026-01-15');
    const result = runScheduler([care], today, () => []);
    expect(result.updatedPlans.has('tp_fixed')).toBe(true);
    expect(result.updatedPlans.get('tp_fixed')!.lastDoAtDate).toBe('2026-01-15');
  });
});

describe('evaluateIntervalFixed edge cases', () => {
  it('handles month boundary with months interval from Jan 31', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { months: 1 },
      startDate: '2026-01-31',
    });
    plan.lastDoAtDate = '2026-01-31';
    const today = Temporal.PlainDate.from('2026-03-01');
    const result = evaluateIntervalFixed(plan, today);
    expect(result).not.toBeNull();
    const doAt = Temporal.PlainDate.from(result!.doAt);
    expect(doAt.year).toBe(2026);
    expect(doAt.month).toBeGreaterThanOrEqual(2);
  });

  it('handles weekly interval', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { weeks: 2 },
      startDate: '2026-01-05',
    });
    const today = Temporal.PlainDate.from('2026-01-19');
    const result = evaluateIntervalFixed(plan, today);
    expect(result!.doAt).toBe('2026-01-19');
  });

  it('returns null for wrong subtype', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'AFTER_DONE',
      interval: { days: 3 },
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    expect(evaluateIntervalFixed(plan, today)).toBeNull();
  });
});

describe('evaluateFixedDays edge cases', () => {
  it('WEEKDAYS returns today when today matches dayOfWeek', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'WEEKDAYS',
      daysOfWeek: [1],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-12');
    expect(today.dayOfWeek).toBe(1);
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2026-01-12');
  });

  it('YEARDAYS rolls to next year when date has passed', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'YEARDAYS',
      dates: [{ month: 1, day: 15 }],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-06-01');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2027-01-15');
  });

  it('YEARDAYS Feb 29 clamps to Feb 28 in non-leap year', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'YEARDAYS',
      dates: [{ month: 2, day: 29 }],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-01');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2026-02-28');
  });

  it('returns empty for wrong recurrence type', () => {
    const plan = makePlan({
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval: { days: 1 },
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-15');
    expect(evaluateFixedDays(plan, today, [])).toEqual([]);
  });

  it('MONTHDAYS generates next month when day has passed this month', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [5],
      startDate: '2026-01-01',
    });
    const today = Temporal.PlainDate.from('2026-01-10');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2026-02-05');
  });

  it('MONTHDAYS leap year February day 29', () => {
    const plan = makePlan({
      type: 'FIXED_DAYS',
      subtype: 'MONTHDAYS',
      daysOfMonth: [29],
      startDate: '2024-01-01',
    });
    const today = Temporal.PlainDate.from('2024-02-01');
    const result = evaluateFixedDays(plan, today, []);
    expect(result.length).toBe(1);
    expect(result[0].doAt).toBe('2024-02-29');
  });
});

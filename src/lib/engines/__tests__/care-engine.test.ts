import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
	evaluateIntervalFixed,
	evaluateIntervalAfterDone,
	evaluateFixedDays,
	evaluateTaskPlan,
	runScheduler
} from '../care-engine';
import type { TaskPlan, TaskDoc, CareDoc } from '$lib/types';

function makePlan(
	overrides: Partial<TaskPlan['recurrence']> & { type: TaskPlan['recurrence']['type'] }
): TaskPlan {
	const base: TaskPlan = {
		_id: 'tp_test',
		title: 'Test Task',
		recurrence: overrides as TaskPlan['recurrence'],
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z'
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
		...overrides
	};
}

describe('evaluateIntervalFixed', () => {
	it('generates task at startDate when no lastDoAtDate and startDate is today', () => {
		const plan = makePlan({
			type: 'INTERVAL',
			subtype: 'FIXED',
			interval: { days: 7 },
			startDate: '2026-01-15'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-15'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-10'
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
			startDate: '2026-01-01'
		});
		plan.lastDoneDate = '2026-01-05';
		const today = Temporal.PlainDate.from('2026-01-08');
		const existing = [makeTask({ taskPlanId: 'tp_test', status: 'DONE' })];
		const result = evaluateIntervalAfterDone(plan, today, existing);
		expect(result).not.toBeNull();
		expect(result!.doAt).toBe('2026-01-08');
	});
});

describe('evaluateFixedDays', () => {
	it('generates tasks for WEEKDAYS', () => {
		const plan = makePlan({
			type: 'FIXED_DAYS',
			subtype: 'WEEKDAYS',
			daysOfWeek: [1, 5],
			startDate: '2026-01-01'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-01'
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
				{ month: 7, day: 4 }
			],
			startDate: '2026-01-01'
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
			startDate: '2026-01-01'
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
			startDate: '2026-01-15'
		});
		const today = Temporal.PlainDate.from('2026-01-05');
		const result = evaluateFixedDays(plan, today, []);
		expect(result.length).toBe(1);
		expect(
			Temporal.PlainDate.compare(
				Temporal.PlainDate.from(result[0].doAt),
				Temporal.PlainDate.from('2026-01-15')
			) >= 0
		).toBe(true);
	});
});

describe('evaluateTaskPlan', () => {
	it('dispatches to evaluateIntervalFixed', () => {
		const plan = makePlan({
			type: 'INTERVAL',
			subtype: 'FIXED',
			interval: { days: 7 },
			startDate: '2026-01-15'
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
			startDate: '2026-01-10'
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
			startDate: '2026-01-01'
		});
		const today = Temporal.PlainDate.from('2026-01-12');
		const result = evaluateTaskPlan(plan, today, []);
		expect(result).not.toBeNull();
	});
});

describe('runScheduler', () => {
	it('sets careId on generated tasks', () => {
		const plan: TaskPlan = {
			_id: 'tp_1',
			title: 'Water plants',
			recurrence: {
				type: 'INTERVAL',
				subtype: 'FIXED',
				interval: { days: 7 },
				startDate: '2026-01-15'
			},
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z'
		};
		const care: CareDoc = {
			_id: 'care_1',
			type: 'Care',
			title: 'Plants',
			taskPlans: [plan],
			createdAt: '2026-01-01T00:00:00Z',
			updatedAt: '2026-01-01T00:00:00Z'
		};
		const today = Temporal.PlainDate.from('2026-01-15');
		const result = runScheduler([care], today, () => []);
		expect(result.tasks.length).toBe(1);
		expect(result.tasks[0].careId).toBe('care_1');
	});
});

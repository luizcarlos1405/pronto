import { describe, it, expect } from 'vitest';
import { calculateGoalStatus } from '../goal-engine';
import type { GoalDoc, TaskDoc } from '$lib/types';

function makeGoal(status: GoalDoc['status'] = 'NOT_STARTED'): GoalDoc {
	return {
		_id: 'goal_1',
		type: 'Goal',
		title: 'Test Goal',
		status,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z'
	};
}

function makeTask(status: TaskDoc['status'] = 'TODO'): TaskDoc {
	return {
		_id: 'task_1',
		type: 'Task',
		title: 'T',
		doAt: '2026-01-01',
		status,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
		goalId: 'goal_1'
	};
}

describe('calculateGoalStatus', () => {
	it('returns NOT_STARTED when no tasks', () => {
		expect(calculateGoalStatus(makeGoal(), [])).toBe('NOT_STARTED');
	});

	it('returns IN_PROGRESS when some tasks are not done', () => {
		const tasks = [makeTask('TODO'), makeTask('DONE')];
		expect(calculateGoalStatus(makeGoal(), tasks)).toBe('IN_PROGRESS');
	});

	it('returns IN_PROGRESS when all tasks are TODO', () => {
		const tasks = [makeTask('TODO'), makeTask('TODO')];
		expect(calculateGoalStatus(makeGoal(), tasks)).toBe('IN_PROGRESS');
	});

	it('returns REVIEW when all tasks are DONE', () => {
		const tasks = [makeTask('DONE'), makeTask('DONE')];
		expect(calculateGoalStatus(makeGoal(), tasks)).toBe('REVIEW');
	});

	it('returns IN_PROGRESS when adding TODO task to COMPLETED goal', () => {
		const tasks = [makeTask('TODO')];
		expect(calculateGoalStatus(makeGoal('COMPLETED'), tasks)).toBe('IN_PROGRESS');
	});

	it('returns NOT_STARTED for COMPLETED goal with no tasks', () => {
		expect(calculateGoalStatus(makeGoal('COMPLETED'), [])).toBe('NOT_STARTED');
	});
});

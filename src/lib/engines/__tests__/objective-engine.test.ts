import { describe, it, expect } from 'vitest';
import { calculateObjectiveStatus } from '../objective-engine';
import type { ObjectiveDoc, TaskDoc } from '$lib/types';

function makeObjective(status: ObjectiveDoc['status'] = 'NOT_STARTED'): ObjectiveDoc {
	return {
		_id: 'obj_1',
		type: 'Objective',
		title: 'Test Objective',
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
		objectiveId: 'obj_1'
	};
}

describe('calculateObjectiveStatus', () => {
	it('returns NOT_STARTED when no tasks', () => {
		expect(calculateObjectiveStatus(makeObjective(), [])).toBe('NOT_STARTED');
	});

	it('returns IN_PROGRESS when some tasks are not done', () => {
		const tasks = [makeTask('TODO'), makeTask('DONE')];
		expect(calculateObjectiveStatus(makeObjective(), tasks)).toBe('IN_PROGRESS');
	});

	it('returns IN_PROGRESS when all tasks are TODO', () => {
		const tasks = [makeTask('TODO'), makeTask('TODO')];
		expect(calculateObjectiveStatus(makeObjective(), tasks)).toBe('IN_PROGRESS');
	});

	it('returns REVIEW when all tasks are DONE', () => {
		const tasks = [makeTask('DONE'), makeTask('DONE')];
		expect(calculateObjectiveStatus(makeObjective(), tasks)).toBe('REVIEW');
	});

	it('returns COMPLETED when objective is already COMPLETED', () => {
		const tasks = [makeTask('TODO')];
		expect(calculateObjectiveStatus(makeObjective('COMPLETED'), tasks)).toBe('COMPLETED');
	});

	it('returns COMPLETED even with no tasks when already COMPLETED', () => {
		expect(calculateObjectiveStatus(makeObjective('COMPLETED'), [])).toBe('COMPLETED');
	});
});

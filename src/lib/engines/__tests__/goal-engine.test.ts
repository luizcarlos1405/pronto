import { describe, it, expect } from 'vitest';
import { calculateGoalStatus, filterToTopTaskPerGoal } from '../goal-engine';
import type { GoalDoc, TaskDoc } from '$lib/types';

function makeGoal(status: GoalDoc['status'] = 'NOT_STARTED'): GoalDoc {
  return {
    _id: 'goal_1',
    type: 'Goal',
    title: 'Test Goal',
    status,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function makeTask(status: TaskDoc['status'] = 'TODO', overrides: Partial<TaskDoc> = {}): TaskDoc {
  return {
    _id: 'task_1',
    type: 'Task',
    title: 'T',
    doAt: '2026-01-01',
    status,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    goalId: 'goal_1',
    ...overrides,
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

describe('filterToTopTaskPerGoal', () => {
  it('passes through tasks without a goalId', () => {
    const tasks = [
      makeTask('TODO', { _id: 't1', goalId: undefined }),
      makeTask('TODO', { _id: 't2', goalId: undefined }),
    ];
    expect(filterToTopTaskPerGoal(tasks)).toEqual(tasks);
  });

  it('keeps only the top task (lowest stepOrder) per goal', () => {
    const tasks = [
      makeTask('TODO', { _id: 't1', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 't2', goalId: 'g1', stepOrder: 1 }),
      makeTask('TODO', { _id: 't3', goalId: 'g1', stepOrder: 2 }),
    ];
    const result = filterToTopTaskPerGoal(tasks);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('t1');
  });

  it('reflects reordering: new top task after stepOrder change', () => {
    const tasks = [
      makeTask('TODO', { _id: 'A', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 'B', goalId: 'g1', stepOrder: 1 }),
      makeTask('TODO', { _id: 'C', goalId: 'g1', stepOrder: 2 }),
    ];
    const reordered = [
      makeTask('TODO', { _id: 'B', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 'A', goalId: 'g1', stepOrder: 1 }),
      makeTask('TODO', { _id: 'C', goalId: 'g1', stepOrder: 2 }),
    ];
    const result = filterToTopTaskPerGoal(reordered);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('B');
  });

  it('handles multiple goals independently', () => {
    const tasks = [
      makeTask('TODO', { _id: 'a1', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 'a2', goalId: 'g1', stepOrder: 1 }),
      makeTask('TODO', { _id: 'b1', goalId: 'g2', stepOrder: 0 }),
      makeTask('TODO', { _id: 'b2', goalId: 'g2', stepOrder: 1 }),
    ];
    const result = filterToTopTaskPerGoal(tasks);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t._id)).toEqual(['a1', 'b1']);
  });

  it('keeps the single task of a goal with one task', () => {
    const tasks = [makeTask('TODO', { _id: 't1', goalId: 'g1', stepOrder: 0 })];
    const result = filterToTopTaskPerGoal(tasks);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('t1');
  });

  it('treats undefined stepOrder as Infinity', () => {
    const tasks = [
      makeTask('TODO', { _id: 't1', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 't2', goalId: 'g1' }),
    ];
    const result = filterToTopTaskPerGoal(tasks);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('t1');
  });

  it('mixed: standalone tasks + top task per goal', () => {
    const tasks = [
      makeTask('TODO', { _id: 's1', goalId: undefined }),
      makeTask('TODO', { _id: 's2', goalId: undefined }),
      makeTask('TODO', { _id: 'a1', goalId: 'g1', stepOrder: 0 }),
      makeTask('TODO', { _id: 'a2', goalId: 'g1', stepOrder: 1 }),
      makeTask('TODO', { _id: 'b1', goalId: 'g2', stepOrder: 0 }),
      makeTask('TODO', { _id: 'b2', goalId: 'g2', stepOrder: 1 }),
    ];
    const result = filterToTopTaskPerGoal(tasks);
    expect(result.map((t) => t._id)).toEqual(['s1', 's2', 'a1', 'b1']);
  });
});

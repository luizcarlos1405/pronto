import { describe, it, expect } from 'vitest';
import type { TaskDoc } from '$lib/types';

function snapshotTask(task: TaskDoc): TaskDoc {
  return { ...task };
}

function makeTask(overrides: Partial<TaskDoc> = {}): TaskDoc {
  return {
    _id: 'task_abc123',
    _rev: '1-xxx',
    type: 'Task',
    title: 'Test task',
    doAt: '2026-04-19',
    status: 'TODO',
    goalId: 'goal_1',
    stepOrder: 2,
    originInboxItemId: 'inbox_1',
    careId: 'care_1',
    taskPlanId: 'tp_1',
    tasksListOrder: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides
  };
}

describe('snapshotTask', () => {
  it('creates a shallow copy preserving _id', () => {
    const task = makeTask();
    const snap = snapshotTask(task);
    expect(snap).toEqual(task);
    expect(snap._id).toBe('task_abc123');
  });

  it('snapshot is independent of original', () => {
    const task = makeTask();
    const snap = snapshotTask(task);
    snap.title = 'changed';
    expect(task.title).toBe('Test task');
  });

  it('preserves all optional fields', () => {
    const task = makeTask({
      goalId: 'goal_42',
      stepOrder: 10,
      originInboxItemId: 'inbox_99',
      careId: 'care_7',
      taskPlanId: 'tp_3',
      tasksListOrder: 100,
      completedAt: '2026-04-19T12:00:00Z'
    });
    const snap = snapshotTask(task);
    expect(snap._id).toBe(task._id);
    expect(snap.goalId).toBe('goal_42');
    expect(snap.stepOrder).toBe(10);
    expect(snap.originInboxItemId).toBe('inbox_99');
    expect(snap.careId).toBe('care_7');
    expect(snap.taskPlanId).toBe('tp_3');
    expect(snap.tasksListOrder).toBe(100);
    expect(snap.completedAt).toBe('2026-04-19T12:00:00Z');
  });
});

import { Temporal } from '@js-temporal/polyfill';
import { nanoid } from 'nanoid';
import { getDb } from './database';
import { nextOrder, byListOrder } from '$lib/engines/ordering';
import type { TaskDoc } from '$lib/types';

export async function createTask(data: {
  title: string;
  doAt: string;
  goalId?: string;
  stepOrder?: number;
  originInboxItemId?: string;
  careId?: string;
  taskPlanId?: string;
  tasksListOrder?: number;
}): Promise<TaskDoc> {
  const now = Temporal.Now.instant().toString();
  let stepOrder = data.stepOrder;
  if (data.goalId && stepOrder == null) {
    const existing = await getTasksByGoal(data.goalId);
    stepOrder = nextOrder(existing.map((t) => t.stepOrder));
  }
  let tasksListOrder = data.tasksListOrder;
  if (tasksListOrder == null) {
    const db = await getDb();
    const result = await db.find({
      selector: { type: 'Task' },
      fields: ['tasksListOrder'],
    });
    tasksListOrder = nextOrder((result.docs as TaskDoc[]).map((t) => t.tasksListOrder));
  }
  const doc: TaskDoc = {
    _id: `task_${nanoid()}`,
    type: 'Task',
    title: data.title,
    doAt: data.doAt,
    status: 'TODO',
    goalId: data.goalId,
    stepOrder,
    originInboxItemId: data.originInboxItemId,
    careId: data.careId,
    taskPlanId: data.taskPlanId,
    tasksListOrder,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const result = await db.put(doc);
  doc._rev = result.rev;
  return doc;
}

export async function getTask(id: string): Promise<TaskDoc> {
  const db = await getDb();
  return db.get<TaskDoc>(id);
}

export async function updateTask(doc: TaskDoc): Promise<TaskDoc> {
  const db = await getDb();
  doc.updatedAt = Temporal.Now.instant().toString();
  const result = await db.put(doc);
  doc._rev = result.rev;
  return doc;
}

export async function restoreTask(doc: TaskDoc): Promise<TaskDoc> {
  const db = await getDb();
  const toPut: TaskDoc = { ...doc };
  delete toPut._rev;
  toPut.updatedAt = Temporal.Now.instant().toString();
  const result = await db.put(toPut);
  toPut._rev = result.rev;
  return toPut;
}

export async function removeTask(id: string): Promise<void> {
  const db = await getDb();
  const doc = await db.get<TaskDoc>(id);
  await db.remove(doc);
}

export async function getVisibleTasks(today: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: {
      type: 'Task',
      status: 'TODO',
      doAt: { $lte: today },
      createdAt: { $gt: null },
    },
    sort: [{ type: 'asc' }, { status: 'asc' }, { doAt: 'asc' }, { createdAt: 'asc' }],
  });
  return (result.docs as TaskDoc[]).toSorted(byListOrder((t) => t.tasksListOrder));
}

export async function getDoneToday(todayDate: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const allDone = await db.find({
    selector: { type: 'Task', status: 'DONE' },
  });
  return (allDone.docs as TaskDoc[]).filter((t) => {
    if (!t.completedAt) return false;
    const completedDate = t.completedAt.slice(0, 10);
    return completedDate === todayDate;
  });
}

export async function getTasksByGoal(goalId: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Task', goalId, doAt: { $gt: null } },
    sort: [{ type: 'asc' }, { goalId: 'asc' }, { doAt: 'asc' }],
  });
  return (result.docs as TaskDoc[]).toSorted(
    (a, b) => (a.stepOrder ?? Infinity) - (b.stepOrder ?? Infinity),
  );
}

export async function getTasksByCare(careId: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Task', careId, doAt: { $gt: null } },
    sort: [{ type: 'asc' }, { careId: 'asc' }, { doAt: 'asc' }],
  });
  return result.docs as TaskDoc[];
}

export async function getTasksByTaskPlan(taskPlanId: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Task', taskPlanId },
  });
  return result.docs as TaskDoc[];
}

export async function getNextTaskForGoals(goalIds: string[]): Promise<Map<string, TaskDoc>> {
  if (goalIds.length === 0) return new Map();
  const db = await getDb();
  const result = await db.find({
    selector: {
      type: 'Task',
      status: 'TODO',
      goalId: { $in: goalIds },
    },
    sort: [{ type: 'asc' }, { status: 'asc' }, { goalId: 'asc' }, { stepOrder: 'asc' }],
  });
  const map = new Map<string, TaskDoc>();
  for (const task of result.docs as TaskDoc[]) {
    if (task.goalId && !map.has(task.goalId)) {
      map.set(task.goalId, task);
    }
  }
  return map;
}

export async function getActiveTasksForPlan(taskPlanId: string): Promise<TaskDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Task', taskPlanId, status: 'TODO' },
  });
  return result.docs as TaskDoc[];
}

export async function completeTask(id: string): Promise<TaskDoc> {
  const doc = await getTask(id);
  doc.status = 'DONE';
  doc.completedAt = Temporal.Now.instant().toString();
  return updateTask(doc);
}

export async function uncompleteTask(id: string): Promise<TaskDoc> {
  const doc = await getTask(id);
  doc.status = 'TODO';
  delete doc.completedAt;
  return updateTask(doc);
}

export async function reorderGoalTasks(goalId: string, taskIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < taskIds.length; i++) {
    const doc = await db.get<TaskDoc>(taskIds[i]);
    doc.stepOrder = i;
    doc.updatedAt = Temporal.Now.instant().toString();
    await db.put(doc);
  }
}

export async function assignStepOrder(goalId: string): Promise<void> {
  const tasks = await getTasksByGoal(goalId);
  const needsMigration = tasks.some((t) => t.stepOrder == null);
  if (!needsMigration) return;

  const sorted = tasks.toSorted((a, b) => {
    const doAtDiff = a.doAt.localeCompare(b.doAt);
    if (doAtDiff !== 0) return doAtDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const db = await getDb();
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].stepOrder !== i) {
      sorted[i].stepOrder = i;
      sorted[i].updatedAt = Temporal.Now.instant().toString();
      await db.put(sorted[i]);
    }
  }
}

export async function updateTasksCareForPlan(taskPlanId: string, newCareId: string): Promise<void> {
  const tasks = await getTasksByTaskPlan(taskPlanId);
  const db = await getDb();
  for (const task of tasks) {
    task.careId = newCareId;
    task.updatedAt = Temporal.Now.instant().toString();
    await db.put(task);
  }
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < taskIds.length; i++) {
    const doc = await db.get<TaskDoc>(taskIds[i]);
    doc.tasksListOrder = i;
    doc.updatedAt = Temporal.Now.instant().toString();
    await db.put(doc);
  }
}

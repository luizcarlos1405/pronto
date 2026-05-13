import { Temporal } from '@js-temporal/polyfill';
import { nanoid } from 'nanoid';
import { getDb } from './database';
import { nextOrder, byListOrder } from '$lib/engines/ordering';
import type { GoalDoc } from '$lib/types';

export async function createGoal(title: string, originInboxItemId?: string): Promise<GoalDoc> {
  const now = Temporal.Now.instant().toString();
  const existing = await getAllGoals();
  const doc: GoalDoc = {
    _id: `goal_${nanoid()}`,
    type: 'Goal',
    title,
    status: 'NOT_STARTED',
    goalsListOrder: nextOrder(existing.map((g) => g.goalsListOrder)),
    originInboxItemId,
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  const result = await db.put(doc);
  doc._rev = result.rev;
  return doc;
}

export async function getGoal(id: string): Promise<GoalDoc> {
  const db = await getDb();
  return db.get<GoalDoc>(id);
}

export async function updateGoal(doc: GoalDoc): Promise<GoalDoc> {
  const db = await getDb();
  doc.updatedAt = Temporal.Now.instant().toString();
  const result = await db.put(doc);
  doc._rev = result.rev;
  return doc;
}

export async function removeGoal(id: string): Promise<void> {
  const db = await getDb();
  const doc = await db.get<GoalDoc>(id);
  await db.remove(doc);
}

export async function getAllGoals(): Promise<GoalDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Goal', createdAt: { $gt: null } },
    sort: [{ type: 'asc' }, { createdAt: 'desc' }],
    limit: Infinity,
  });
  const goals = result.docs as GoalDoc[];
  return goals.toSorted(byListOrder((g) => g.goalsListOrder));
}

export async function reorderGoals(goalIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < goalIds.length; i++) {
    const doc = await db.get<GoalDoc>(goalIds[i]);
    doc.goalsListOrder = i;
    doc.updatedAt = Temporal.Now.instant().toString();
    await db.put(doc);
  }
}

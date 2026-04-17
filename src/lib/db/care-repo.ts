import { nanoid } from 'nanoid';
import { getDb } from './database';
import type { CareDoc, TaskPlan } from '$lib/types';

export async function createCare(
  title: string,
  taskPlans: Omit<TaskPlan, '_id' | 'createdAt' | 'updatedAt'>[],
  originInboxItemId?: string
): Promise<CareDoc> {
  const now = new Date().toISOString();
  const doc: CareDoc = {
    _id: `care_${nanoid()}`,
    type: 'Care',
    title,
    taskPlans: taskPlans.map((tp) => ({
      ...tp,
      _id: `tp_${nanoid()}`,
      createdAt: now,
      updatedAt: now
    })),
    originInboxItemId,
    createdAt: now,
    updatedAt: now
  };
  const db = await getDb();
  await db.put(doc);
  return doc;
}

export async function getCare(id: string): Promise<CareDoc> {
  const db = await getDb();
  return db.get<CareDoc>(id);
}

export async function updateCare(doc: CareDoc): Promise<CareDoc> {
  const db = await getDb();
  doc.updatedAt = new Date().toISOString();
  const result = await db.put(doc);
  doc._rev = result.rev;
  return doc;
}

export async function removeCare(id: string): Promise<void> {
  const db = await getDb();
  const doc = await db.get<CareDoc>(id);
  await db.remove(doc);
}

export async function getAllCares(): Promise<CareDoc[]> {
  const db = await getDb();
  const result = await db.find({
    selector: { type: 'Care', createdAt: { $gt: null } },
    sort: [{ type: 'asc' }, { createdAt: 'desc' }]
  });
  return result.docs as CareDoc[];
}

export async function addTaskPlan(
  careId: string,
  plan: Omit<TaskPlan, '_id' | 'createdAt' | 'updatedAt'>
): Promise<CareDoc> {
  const doc = await getCare(careId);
  const now = new Date().toISOString();
  doc.taskPlans.push({
    ...plan,
    _id: `tp_${nanoid()}`,
    createdAt: now,
    updatedAt: now
  });
  return updateCare(doc);
}

export async function removeTaskPlan(careId: string, planId: string): Promise<CareDoc> {
  const doc = await getCare(careId);
  doc.taskPlans = doc.taskPlans.filter((tp) => tp._id !== planId);
  return updateCare(doc);
}

export async function updateTaskPlan(
  careId: string,
  planId: string,
  updates: Partial<TaskPlan>
): Promise<CareDoc> {
  const doc = await getCare(careId);
  const idx = doc.taskPlans.findIndex((tp) => tp._id === planId);
  if (idx === -1) throw new Error(`TaskPlan ${planId} not found in Care ${careId}`);
  doc.taskPlans[idx] = {
    ...doc.taskPlans[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return updateCare(doc);
}

import { nanoid } from 'nanoid';
import { getDb } from './database';
import type { GoalDoc } from '$lib/types';

export async function createGoal(title: string, originInboxItemId?: string): Promise<GoalDoc> {
	const now = new Date().toISOString();
	const doc: GoalDoc = {
		_id: `goal_${nanoid()}`,
		type: 'Goal',
		title,
		status: 'NOT_STARTED',
		originInboxItemId,
		createdAt: now,
		updatedAt: now
	};
	const db = await getDb();
	await db.put(doc);
	return doc;
}

export async function getGoal(id: string): Promise<GoalDoc> {
	const db = await getDb();
	return db.get<GoalDoc>(id);
}

export async function updateGoal(doc: GoalDoc): Promise<GoalDoc> {
	const db = await getDb();
	doc.updatedAt = new Date().toISOString();
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
		sort: [{ type: 'asc' }, { createdAt: 'desc' }]
	});
	return result.docs as GoalDoc[];
}

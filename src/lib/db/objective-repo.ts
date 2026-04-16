import { nanoid } from 'nanoid';
import { getDb } from './database';
import type { ObjectiveDoc } from '$lib/types';

export async function createObjective(
	title: string,
	originInboxItemId?: string
): Promise<ObjectiveDoc> {
	const now = new Date().toISOString();
	const doc: ObjectiveDoc = {
		_id: `obj_${nanoid()}`,
		type: 'Objective',
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

export async function getObjective(id: string): Promise<ObjectiveDoc> {
	const db = await getDb();
	return db.get<ObjectiveDoc>(id);
}

export async function updateObjective(doc: ObjectiveDoc): Promise<ObjectiveDoc> {
	const db = await getDb();
	doc.updatedAt = new Date().toISOString();
	const result = await db.put(doc);
	doc._rev = result.rev;
	return doc;
}

export async function removeObjective(id: string): Promise<void> {
	const db = await getDb();
	const doc = await db.get<ObjectiveDoc>(id);
	await db.remove(doc);
}

export async function getAllObjectives(): Promise<ObjectiveDoc[]> {
	const db = await getDb();
	const result = await db.find({
		selector: { type: 'Objective', createdAt: { $gt: null } },
		sort: [{ type: 'asc' }, { createdAt: 'desc' }]
	});
	return result.docs as ObjectiveDoc[];
}

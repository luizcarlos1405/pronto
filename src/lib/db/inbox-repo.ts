import { nanoid } from 'nanoid';
import { getDb } from './database';
import type { InboxItemDoc } from '$lib/types';

export async function createInboxItem(title: string): Promise<InboxItemDoc> {
	const doc: InboxItemDoc = {
		_id: `inbox_${nanoid()}`,
		type: 'InboxItem',
		title,
		isProcessed: false,
		createdAt: new Date().toISOString()
	};
	const db = await getDb();
	await db.put(doc);
	return doc;
}

export async function getInboxItem(id: string): Promise<InboxItemDoc> {
	const db = await getDb();
	const doc = await db.get<InboxItemDoc>(id);
	return doc;
}

export async function updateInboxItem(doc: InboxItemDoc): Promise<InboxItemDoc> {
	const db = await getDb();
	const result = await db.put(doc);
	doc._rev = result.rev;
	return doc;
}

export async function getUnprocessed(): Promise<InboxItemDoc[]> {
	const db = await getDb();
	const result = await db.find({
		selector: { type: 'InboxItem', isProcessed: false, createdAt: { $gt: null } },
		sort: [{ type: 'asc' }, { isProcessed: 'asc' }, { createdAt: 'desc' }]
	});
	return result.docs as InboxItemDoc[];
}

export async function getProcessed(): Promise<InboxItemDoc[]> {
	const db = await getDb();
	const result = await db.find({
		selector: { type: 'InboxItem', isProcessed: true, createdAt: { $gt: null } },
		sort: [{ type: 'asc' }, { isProcessed: 'asc' }, { createdAt: 'desc' }]
	});
	return result.docs as InboxItemDoc[];
}

export async function markProcessed(id: string): Promise<InboxItemDoc> {
	const doc = await getInboxItem(id);
	doc.isProcessed = true;
	return updateInboxItem(doc);
}

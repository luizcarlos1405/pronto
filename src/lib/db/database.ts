import PouchDB from 'pouchdb-browser';
import type { InboxItemDoc, TaskDoc, ObjectiveDoc, CareDoc } from '$lib/types';

type ProntoDoc = InboxItemDoc | TaskDoc | ObjectiveDoc | CareDoc;

export type Database = PouchDB.Database<ProntoDoc>;

let dbInstance: Database | null = null;

export function getDb(): Database {
	if (!dbInstance) {
		dbInstance = new PouchDB<ProntoDoc>('pronto');
		setupIndexes(dbInstance);
	}
	return dbInstance;
}

async function setupIndexes(db: Database): Promise<void> {
	await db.createIndex({ index: { fields: ['type'] } });
	await db.createIndex({ index: { fields: ['type', 'status'] } });
	await db.createIndex({ index: { fields: ['type', 'isProcessed'] } });
	await db.createIndex({ index: { fields: ['type', 'careId'] } });
	await db.createIndex({ index: { fields: ['type', 'objectiveId'] } });
	await db.createIndex({ index: { fields: ['type', 'taskPlanId'] } });
	await db.createIndex({ index: { fields: ['type', 'taskPlanId', 'status'] } });
	await db.createIndex({ index: { fields: ['type', 'taskPlanId', 'doAt'] } });
}

export { getDb as db };

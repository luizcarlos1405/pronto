import PouchDB from 'pouchdb-browser';
import pouchdbFind from 'pouchdb-find';
import type { InboxItemDoc, TaskDoc, ObjectiveDoc, CareDoc } from '$lib/types';

PouchDB.plugin(pouchdbFind);

type FazDoc = InboxItemDoc | TaskDoc | ObjectiveDoc | CareDoc;

export type Database = PouchDB.Database<FazDoc>;

let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;

export async function getDb(): Promise<Database> {
	if (!dbInstance) {
		dbInstance = new PouchDB<FazDoc>('faz');
		initPromise = setupIndexes(dbInstance);
	}
	if (initPromise) {
		await initPromise;
		initPromise = null;
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
	await db.createIndex({ index: { fields: ['type', 'createdAt'] } });
	await db.createIndex({ index: { fields: ['type', 'status', 'doAt', 'createdAt'] } });
	await db.createIndex({ index: { fields: ['type', 'objectiveId', 'doAt'] } });
	await db.createIndex({ index: { fields: ['type', 'careId', 'doAt'] } });
	await db.createIndex({ index: { fields: ['type', 'isProcessed', 'createdAt'] } });
}

export { getDb as db };

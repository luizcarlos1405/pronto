import PouchDB from 'pouchdb-browser';
import pouchdbFind from 'pouchdb-find';
import type { InboxItemDoc, TaskDoc, GoalDoc, CareDoc } from '$lib/types';

PouchDB.plugin(pouchdbFind);

type FazDoc = InboxItemDoc | TaskDoc | GoalDoc | CareDoc;

export type Database = PouchDB.Database<FazDoc>;

// Max value accepted by IDBObjectStore.getAll() — passing Infinity or larger values
// (e.g. Number.MAX_SAFE_INTEGER) causes a TypeError at the IndexedDB boundary.
// Use this as the `limit` in pouchdb-find queries that should return all documents.
export const FIND_LIMIT_ALL = 4294967295;

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
  await db.createIndex({ index: { fields: ['type', 'goalId'] } });
  await db.createIndex({ index: { fields: ['type', 'taskPlanId'] } });
  await db.createIndex({ index: { fields: ['type', 'taskPlanId', 'status'] } });
  await db.createIndex({ index: { fields: ['type', 'taskPlanId', 'doAt'] } });
  await db.createIndex({ index: { fields: ['type', 'createdAt'] } });
  await db.createIndex({ index: { fields: ['type', 'status', 'doAt', 'createdAt'] } });
  await db.createIndex({ index: { fields: ['type', 'goalId', 'doAt'] } });
  await db.createIndex({ index: { fields: ['type', 'goalId', 'stepOrder'] } });
  await db.createIndex({ index: { fields: ['type', 'status', 'goalId', 'stepOrder'] } });
  await db.createIndex({ index: { fields: ['type', 'careId', 'doAt'] } });
  await db.createIndex({ index: { fields: ['type', 'isProcessed', 'createdAt'] } });
}

export function resetDb(): void {
  dbInstance = null;
  initPromise = null;
}

export { getDb as db };

import { getDb, resetDb } from './database';

export interface FazExport {
	app: 'faz';
	exportedAt: string;
	docs: Record<string, unknown>[];
}

export async function exportAllData(): Promise<FazExport> {
	const db = await getDb();
	const result = await db.allDocs({ include_docs: true });
	const docs = result.rows
		.filter((row) => !row.id.startsWith('_design/') && row.doc)
		.map((row) => row.doc as unknown as Record<string, unknown>);
	return {
		app: 'faz',
		exportedAt: new Date().toISOString(),
		docs
	};
}

export async function importData(data: FazExport): Promise<{ imported: number; skipped: number }> {
	const db = await getDb();
	const docs = data.docs.map((doc) => {
		const { _rev, ...rest } = doc;
		return rest;
	});
	const results = (await db.bulkDocs(docs as any[])) as Array<
		PouchDB.Core.Response | PouchDB.Core.Error
	>;
	const imported = results.filter((r): r is PouchDB.Core.Response => 'ok' in r).length;
	return { imported, skipped: results.length - imported };
}

export async function clearAllData(): Promise<void> {
	const db = await getDb();
	await db.destroy();
	resetDb();
}

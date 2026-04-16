import { getDb } from '$lib/db/database';
import { createInboxItem, getUnprocessed, markProcessed } from '$lib/db/inbox-repo';
import type { InboxItemDoc } from '$lib/types';

export function getInboxPageState() {
	let items = $state<InboxItemDoc[]>([]);
	let newTitle = $state('');
	let loading = $state(true);

	async function load() {
		loading = true;
		items = await getUnprocessed();
		loading = false;
	}

	async function add() {
		const title = newTitle.trim();
		if (!title) return;
		await createInboxItem(title);
		newTitle = '';
		await load();
	}

	async function discard(id: string) {
		await markProcessed(id);
		await load();
	}

	return {
		get items() { return items; },
		get newTitle() { return newTitle; },
		set newTitle(v: string) { newTitle = v; },
		get loading() { return loading; },
		load,
		add,
		discard
	};
}

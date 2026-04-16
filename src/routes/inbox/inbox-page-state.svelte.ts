import { createInboxItem, getUnprocessed, markProcessed } from '$lib/db/inbox-repo';
import type { InboxItemDoc } from '$lib/types';

export function getInboxPageState() {
	let items = $state<InboxItemDoc[]>([]);
	let newTitle = $state('');
	let loading = $state(true);
	let processingItemId = $state<string | null>(null);

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

	function startProcessing(id: string) {
		processingItemId = id;
	}

	function stopProcessing() {
		processingItemId = null;
	}

	return {
		get items() {
			return items;
		},
		get newTitle() {
			return newTitle;
		},
		set newTitle(v: string) {
			newTitle = v;
		},
		get loading() {
			return loading;
		},
		get processingItemId() {
			return processingItemId;
		},
		load,
		add,
		discard,
		startProcessing,
		stopProcessing
	};
}

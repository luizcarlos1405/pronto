import { createTask } from '$lib/db/task-repo';
import { createGoal } from '$lib/db/goal-repo';
import { createCare } from '$lib/db/care-repo';
import { markProcessed, getInboxItem } from '$lib/db/inbox-repo';
import { SvelteDate } from 'svelte/reactivity';
import type { InboxItemDoc, Recurrence } from '$lib/types';

export type CreatedEntity = { type: 'task' | 'goal' | 'care'; title: string };

export function getInboxProcessorState(inboxItem: InboxItemDoc) {
	let mode = $state<'choose' | 'task' | 'goal' | 'care'>('choose');
	let taskTitle = $state(inboxItem.title);
	let taskDoAt = $state(new SvelteDate().toISOString().slice(0, 10));
	let goalTitle = $state(inboxItem.title);
	let careTitle = $state(inboxItem.title);
	let created = $state<CreatedEntity[]>([]);
	let processing = $state(false);

	async function createTaskFromItem(): Promise<void> {
		const title = taskTitle.trim();
		if (!title) return;
		processing = true;
		await createTask({
			title,
			doAt: taskDoAt,
			originInboxItemId: inboxItem._id
		});
		created = [...created, { type: 'task', title }];
		taskTitle = inboxItem.title;
		processing = false;
	}

	async function createGoalFromItem(): Promise<void> {
		const title = goalTitle.trim();
		if (!title) return;
		processing = true;
		await createGoal(title, inboxItem._id);
		created = [...created, { type: 'goal', title }];
		goalTitle = inboxItem.title;
		processing = false;
	}

	async function createCareFromItem(
		plans: { title: string; recurrence: Recurrence }[]
	): Promise<void> {
		const title = careTitle.trim();
		if (!title) return;
		processing = true;
		await createCare(
			title,
			plans.map((p) => ({ title: p.title, recurrence: p.recurrence })),
			inboxItem._id
		);
		created = [...created, { type: 'care', title }];
		careTitle = inboxItem.title;
		processing = false;
	}

	async function finish(): Promise<void> {
		await markProcessed(inboxItem._id);
	}

	function resetMode() {
		mode = 'choose';
	}

	return {
		get mode() {
			return mode;
		},
		set mode(v: 'choose' | 'task' | 'goal' | 'care') {
			mode = v;
		},
		get taskTitle() {
			return taskTitle;
		},
		set taskTitle(v: string) {
			taskTitle = v;
		},
		get taskDoAt() {
			return taskDoAt;
		},
		set taskDoAt(v: string) {
			taskDoAt = v;
		},
		get goalTitle() {
			return goalTitle;
		},
		set goalTitle(v: string) {
			goalTitle = v;
		},
		get careTitle() {
			return careTitle;
		},
		set careTitle(v: string) {
			careTitle = v;
		},
		get created() {
			return created;
		},
		get processing() {
			return processing;
		},
		get inboxItem() {
			return inboxItem;
		},
		createTask: createTaskFromItem,
		createGoal: createGoalFromItem,
		createCare: createCareFromItem,
		finish,
		resetMode
	};
}

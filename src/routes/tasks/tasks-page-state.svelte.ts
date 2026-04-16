import {
	getVisibleTasks,
	getDoneToday,
	createTask,
	completeTask,
	uncompleteTask,
	removeTask as deleteTask,
	updateTask,
	getTask
} from '$lib/db/task-repo';
import type { TaskDoc } from '$lib/types';
import { Temporal } from '@js-temporal/polyfill';
import { getToastState } from '$lib/components/toast-state.svelte';

function getToday(): string {
	return Temporal.Now.plainDateISO().toString();
}

export function getTasksPageState() {
	let tasks = $state<TaskDoc[]>([]);
	let doneTodayList = $state<TaskDoc[]>([]);
	let newTitle = $state('');
	let loading = $state(true);
	const toast = getToastState();

	async function load() {
		loading = true;
		const today = getToday();
		[tasks, doneTodayList] = await Promise.all([getVisibleTasks(today), getDoneToday(today)]);
		loading = false;
	}

	async function add() {
		const title = newTitle.trim();
		if (!title) return;
		await createTask({ title, doAt: getToday() });
		newTitle = '';
		await load();
	}

	async function toggleComplete(id: string) {
		const task = tasks.find((t) => t._id === id) || doneTodayList.find((t) => t._id === id);
		if (!task) return;
		if (task.status === 'TODO') {
			await completeTask(id);
		} else {
			await uncompleteTask(id);
		}
		await load();
	}

	async function postponeTask(id: string) {
		const task = tasks.find((t) => t._id === id);
		if (!task) return;

		const originalDoAt = task.doAt;
		const tomorrow = Temporal.PlainDate.from(task.doAt).add({ days: 1 }).toString();

		task.doAt = tomorrow;
		await updateTask(task);
		await load();

		toast.notify('Postponed to tomorrow', {
			label: 'Undo',
			fn: async () => {
				const current = await getTask(id);
				if (current) {
					current.doAt = originalDoAt;
					await updateTask(current);
					await load();
				}
			}
		});
	}

	async function removeTask(id: string) {
		const task = tasks.find((t) => t._id === id);
		if (!task) return;

		const backup: Omit<TaskDoc, '_id' | '_rev' | 'updatedAt'> = {
			type: task.type,
			title: task.title,
			doAt: task.doAt,
			status: task.status,
			goalId: task.goalId,
			originInboxItemId: task.originInboxItemId,
			careId: task.careId,
			taskPlanId: task.taskPlanId,
			completedAt: task.completedAt,
			createdAt: task.createdAt
		};

		await deleteTask(id);
		await load();

		toast.notify('Task removed', {
			label: 'Undo',
			fn: async () => {
				await createTask(backup);
				await load();
			}
		});
	}

	return {
		get tasks() {
			return tasks;
		},
		get doneToday() {
			return doneTodayList;
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
		load,
		add,
		toggleComplete,
		postponeTask,
		removeTask
	};
}

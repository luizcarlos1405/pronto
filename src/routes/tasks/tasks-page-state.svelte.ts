import {
	getVisibleTasks,
	getDoneToday,
	createTask,
	completeTask,
	uncompleteTask
} from '$lib/db/task-repo';
import type { TaskDoc } from '$lib/types';

function getToday(): string {
	return new Date().toISOString().slice(0, 10);
}

export function getTasksPageState() {
	let tasks = $state<TaskDoc[]>([]);
	let doneTodayList = $state<TaskDoc[]>([]);
	let newTitle = $state('');
	let loading = $state(true);

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
		toggleComplete
	};
}

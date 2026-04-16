import { getAllObjectives, createObjective, updateObjective, getObjective } from '$lib/db/objective-repo';
import { getTasksByObjective, createTask, completeTask, uncompleteTask } from '$lib/db/task-repo';
import { calculateObjectiveStatus } from '$lib/engines/objective-engine';
import type { ObjectiveDoc, TaskDoc } from '$lib/types';

function getToday(): string {
	return new Date().toISOString().slice(0, 10);
}

export function getObjectivesPageState() {
	let objectives = $state<ObjectiveDoc[]>([]);
	let newTitle = $state('');
	let loading = $state(true);

	async function load() {
		loading = true;
		objectives = await getAllObjectives();
		loading = false;
	}

	async function add() {
		const title = newTitle.trim();
		if (!title) return;
		await createObjective(title);
		newTitle = '';
		await load();
	}

	async function markCompleted(id: string) {
		const obj = await getObjective(id);
		obj.status = 'COMPLETED';
		await updateObjective(obj);
		await load();
	}

	async function recalcStatus(id: string) {
		const obj = await getObjective(id);
		const tasks = await getTasksByObjective(id);
		const newStatus = calculateObjectiveStatus(obj, tasks);
		if (obj.status !== newStatus) {
			obj.status = newStatus;
			await updateObjective(obj);
		}
	}

	return {
		get objectives() { return objectives; },
		get newTitle() { return newTitle; },
		set newTitle(v: string) { newTitle = v; },
		get loading() { return loading; },
		load,
		add,
		markCompleted,
		recalcStatus
	};
}

export function getObjectiveDetailState(objectiveId: string) {
	let objective = $state<ObjectiveDoc | null>(null);
	let tasks = $state<TaskDoc[]>([]);
	let newTaskTitle = $state('');
	let loading = $state(true);

	async function load() {
		loading = true;
		objective = await getObjective(objectiveId);
		tasks = await getTasksByObjective(objectiveId);
		loading = false;
	}

	async function addTask() {
		const title = newTaskTitle.trim();
		if (!title) return;
		await createTask({ title, doAt: getToday(), objectiveId });
		newTaskTitle = '';
		await load();
		const { recalcStatus } = getObjectivesPageState();
		await recalcStatus(objectiveId);
		await load();
	}

	async function toggleTask(taskId: string) {
		const task = tasks.find((t) => t._id === taskId);
		if (!task) return;
		if (task.status === 'TODO') {
			await completeTask(taskId);
		} else {
			await uncompleteTask(taskId);
		}
		const { recalcStatus } = getObjectivesPageState();
		await recalcStatus(objectiveId);
		await load();
	}

	async function markCompleted() {
		const { markCompleted: mc } = getObjectivesPageState();
		await mc(objectiveId);
		await load();
	}

	return {
		get objective() { return objective; },
		get tasks() { return tasks; },
		get newTaskTitle() { return newTaskTitle; },
		set newTaskTitle(v: string) { newTaskTitle = v; },
		get loading() { return loading; },
		load,
		addTask,
		toggleTask,
		markCompleted
	};
}

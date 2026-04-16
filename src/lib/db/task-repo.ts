import { nanoid } from 'nanoid';
import { getDb } from './database';
import type { TaskDoc } from '$lib/types';

export async function createTask(data: {
	title: string;
	doAt: string;
	objectiveId?: string;
	originInboxItemId?: string;
	careId?: string;
	taskPlanId?: string;
}): Promise<TaskDoc> {
	const now = new Date().toISOString();
	const doc: TaskDoc = {
		_id: `task_${nanoid()}`,
		type: 'Task',
		title: data.title,
		doAt: data.doAt,
		status: 'TODO',
		objectiveId: data.objectiveId,
		originInboxItemId: data.originInboxItemId,
		careId: data.careId,
		taskPlanId: data.taskPlanId,
		createdAt: now,
		updatedAt: now
	};
	const db = getDb();
	await db.put(doc);
	return doc;
}

export async function getTask(id: string): Promise<TaskDoc> {
	const db = getDb();
	return db.get<TaskDoc>(id);
}

export async function updateTask(doc: TaskDoc): Promise<TaskDoc> {
	const db = getDb();
	doc.updatedAt = new Date().toISOString();
	const result = await db.put(doc);
	doc._rev = result.rev;
	return doc;
}

export async function removeTask(id: string): Promise<void> {
	const db = getDb();
	const doc = await db.get<TaskDoc>(id);
	await db.remove(doc);
}

export async function getVisibleTasks(today: string): Promise<TaskDoc[]> {
	const db = getDb();
	const result = await db.find({
		selector: {
			type: 'Task',
			status: 'TODO',
			doAt: { $lte: today }
		},
		sort: [{ doAt: 'asc' }, { createdAt: 'asc' }]
	});
	return result.docs as TaskDoc[];
}

export async function getDoneToday(todayDate: string): Promise<TaskDoc[]> {
	const db = getDb();
	const allDone = await db.find({
		selector: { type: 'Task', status: 'DONE' }
	});
	return (allDone.docs as TaskDoc[]).filter((t) => {
		if (!t.completedAt) return false;
		const completedDate = t.completedAt.slice(0, 10);
		return completedDate === todayDate;
	});
}

export async function getTasksByObjective(objectiveId: string): Promise<TaskDoc[]> {
	const db = getDb();
	const result = await db.find({
		selector: { type: 'Task', objectiveId },
		sort: [{ doAt: 'asc' }]
	});
	return result.docs as TaskDoc[];
}

export async function getTasksByCare(careId: string): Promise<TaskDoc[]> {
	const db = getDb();
	const result = await db.find({
		selector: { type: 'Task', careId },
		sort: [{ doAt: 'asc' }]
	});
	return result.docs as TaskDoc[];
}

export async function getTasksByTaskPlan(taskPlanId: string): Promise<TaskDoc[]> {
	const db = getDb();
	const result = await db.find({
		selector: { type: 'Task', taskPlanId }
	});
	return result.docs as TaskDoc[];
}

export async function getActiveTasksForPlan(taskPlanId: string): Promise<TaskDoc[]> {
	const db = getDb();
	const result = await db.find({
		selector: { type: 'Task', taskPlanId, status: 'TODO' }
	});
	return result.docs as TaskDoc[];
}

export async function completeTask(id: string): Promise<TaskDoc> {
	const doc = await getTask(id);
	doc.status = 'DONE';
	doc.completedAt = new Date().toISOString();
	return updateTask(doc);
}

export async function uncompleteTask(id: string): Promise<TaskDoc> {
	const doc = await getTask(id);
	doc.status = 'TODO';
	delete doc.completedAt;
	return updateTask(doc);
}

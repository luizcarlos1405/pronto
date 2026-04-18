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
import { createGoal } from '$lib/db/goal-repo';
import { createCare } from '$lib/db/care-repo';
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
  let editingTask = $state<TaskDoc | null>(null);
  const toast = getToastState();

  async function load() {
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
      stepOrder: task.stepOrder,
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

  function openEdit(taskId: string) {
    const task = tasks.find((t) => t._id === taskId) || doneTodayList.find((t) => t._id === taskId);
    if (task) editingTask = { ...task };
  }

  function closeEdit() {
    editingTask = null;
  }

  async function saveEdit(title: string, doAt: string) {
    if (!editingTask) return;
    const task = await getTask(editingTask._id);
    task.title = title.trim();
    task.doAt = doAt;
    await updateTask(task);
    editingTask = null;
    await load();
  }

  async function transformToGoal() {
    if (!editingTask) return;
    const task = await getTask(editingTask._id);
    const backup: Omit<TaskDoc, '_id' | '_rev' | 'updatedAt'> = {
      type: task.type,
      title: task.title,
      doAt: task.doAt,
      status: task.status,
      goalId: task.goalId,
      stepOrder: task.stepOrder,
      originInboxItemId: task.originInboxItemId,
      careId: task.careId,
      taskPlanId: task.taskPlanId,
      completedAt: task.completedAt,
      createdAt: task.createdAt
    };
    await createGoal(task.title);
    await deleteTask(task._id);
    editingTask = null;
    await load();
    toast.notify('Converted to goal', {
      label: 'Undo',
      fn: async () => {
        await createTask(backup);
        await load();
      }
    });
  }

  async function transformToCare() {
    if (!editingTask) return;
    const task = await getTask(editingTask._id);
    const backup: Omit<TaskDoc, '_id' | '_rev' | 'updatedAt'> = {
      type: task.type,
      title: task.title,
      doAt: task.doAt,
      status: task.status,
      goalId: task.goalId,
      stepOrder: task.stepOrder,
      originInboxItemId: task.originInboxItemId,
      careId: task.careId,
      taskPlanId: task.taskPlanId,
      completedAt: task.completedAt,
      createdAt: task.createdAt
    };
    await createCare(task.title, []);
    await deleteTask(task._id);
    editingTask = null;
    await load();
    toast.notify('Converted to care', {
      label: 'Undo',
      fn: async () => {
        await createTask(backup);
        await load();
      }
    });
  }

  return {
    get tasks() {
      const standalone = tasks.filter((t) => !t.goalId);
      const goalTasks = tasks.filter((t) => t.goalId);
      const seen: Record<string, boolean> = {};
      const firstPerGoal: TaskDoc[] = [];
      for (const t of goalTasks.toSorted(
        (a, b) => (a.stepOrder ?? Infinity) - (b.stepOrder ?? Infinity)
      )) {
        if (t.status !== 'TODO') continue;
        if (seen[t.goalId!]) continue;
        seen[t.goalId!] = true;
        firstPerGoal.push(t);
      }
      return [...standalone, ...firstPerGoal];
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
    get editingTask() {
      return editingTask;
    },
    load,
    add,
    toggleComplete,
    postponeTask,
    removeTask,
    openEdit,
    closeEdit,
    saveEdit,
    transformToGoal,
    transformToCare
  };
}

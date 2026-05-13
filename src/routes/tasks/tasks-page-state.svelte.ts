import {
  getVisibleTasks,
  getDoneToday,
  createTask,
  completeTask,
  uncompleteTask,
  removeTask as deleteTask,
  updateTask,
  getTask,
  reorderTasks,
  restoreTask,
  getNextTaskForGoals,
} from '$lib/db/task-repo';
import { createGoal, getGoal } from '$lib/db/goal-repo';
import { createCare, getCare, markPlanDone } from '$lib/db/care-repo';
import type { TaskDoc } from '$lib/types';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { getTaskRefreshVersion } from '$lib/scheduler-refresh.svelte';

interface OriginInfo {
  type: 'goal' | 'care';
  id: string;
  title: string;
}
import { Temporal } from '@js-temporal/polyfill';
import { getToastState } from '$lib/components/toast-state.svelte';
import { reorderItems } from '$lib/utils/reorderItems';
import { snapshotTask } from '$lib/utils/task-undo';

function getToday(): string {
  return Temporal.Now.plainDateISO().toString();
}

export function getTasksPageState() {
  let allTasks = $state<TaskDoc[]>([]);
  let displayedTasks = $state<TaskDoc[]>([]);
  let doneTodayList = $state<TaskDoc[]>([]);
  let originTitles = new SvelteMap<string, string>();
  let newTitle = $state('');
  let loading = $state(true);
  let editingTask = $state<TaskDoc | null>(null);
  const toast = getToastState();

  $effect(() => {
    getTaskRefreshVersion();
    load();
  });

  async function load() {
    const today = getToday();
    [allTasks, doneTodayList] = await Promise.all([getVisibleTasks(today), getDoneToday(today)]);

    const goalIds = [...new SvelteSet(allTasks.filter((t) => t.goalId).map((t) => t.goalId!))];
    const topTaskPerGoal =
      goalIds.length > 0 ? await getNextTaskForGoals(goalIds) : new SvelteMap<string, TaskDoc>();

    const visibleGoalTaskIds = new SvelteSet<string>();
    for (const topTask of topTaskPerGoal.values()) {
      if (topTask.doAt <= today) {
        visibleGoalTaskIds.add(topTask._id);
      }
    }

    displayedTasks = allTasks.filter((t) => !t.goalId || visibleGoalTaskIds.has(t._id));

    await loadOrigins();
    loading = false;
  }

  async function loadOrigins() {
    const allDocs = [...allTasks, ...doneTodayList];
    const ids = new SvelteSet<string>();
    for (const t of allDocs) {
      if (t.goalId) ids.add(t.goalId);
      if (t.careId) ids.add(t.careId);
    }
    const entries = await Promise.all(
      [...ids].map(async (id) => {
        try {
          if (id.startsWith('goal_')) {
            const doc = await getGoal(id);
            return [id, doc.title] as const;
          }
          if (id.startsWith('care_')) {
            const doc = await getCare(id);
            return [id, doc.title] as const;
          }
        } catch {
          return undefined;
        }
        return undefined;
      }),
    );
    const map = new SvelteMap<string, string>();
    for (const entry of entries) {
      if (entry) map.set(entry[0], entry[1]);
    }
    originTitles = map;
  }

  function getOriginInfo(task: TaskDoc): OriginInfo | null {
    if (task.goalId) {
      const title = originTitles.get(task.goalId);
      if (title) return { type: 'goal', id: task.goalId, title };
    }
    if (task.careId) {
      const title = originTitles.get(task.careId);
      if (title) return { type: 'care', id: task.careId, title };
    }
    return null;
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    await createTask({ title, doAt: getToday() });
    newTitle = '';
    await load();
  }

  async function toggleComplete(id: string) {
    const task = allTasks.find((t) => t._id === id) || doneTodayList.find((t) => t._id === id);
    if (!task) return;
    if (task.status === 'TODO') {
      await completeTask(id);
      if (task.taskPlanId) {
        await markPlanDone(task.taskPlanId, getToday());
      }
    } else {
      await uncompleteTask(id);
    }
    await load();
  }

  async function postponeTask(id: string) {
    const task = allTasks.find((t) => t._id === id);
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
      },
    });
  }

  async function removeTask(id: string) {
    const task = allTasks.find((t) => t._id === id);
    if (!task) return;

    const backup = snapshotTask(task);

    await deleteTask(id);
    await load();

    toast.notify('Task removed', {
      label: 'Undo',
      fn: async () => {
        await restoreTask(backup);
        await load();
      },
    });
  }

  function openEdit(taskId: string) {
    const task =
      allTasks.find((t) => t._id === taskId) || doneTodayList.find((t) => t._id === taskId);
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
    const backup = snapshotTask(task);
    await createGoal(task.title);
    await deleteTask(task._id);
    editingTask = null;
    await load();
    toast.notify('Converted to goal', {
      label: 'Undo',
      fn: async () => {
        await restoreTask(backup);
        await load();
      },
    });
  }

  async function transformToCare() {
    if (!editingTask) return;
    const task = await getTask(editingTask._id);
    const backup = snapshotTask(task);
    await createCare(task.title, []);
    await deleteTask(task._id);
    editingTask = null;
    await load();
    toast.notify('Converted to care', {
      label: 'Undo',
      fn: async () => {
        await restoreTask(backup);
        await load();
      },
    });
  }

  function reorder(fromIndex: number, toIndex: number) {
    displayedTasks = reorderItems(displayedTasks, fromIndex, toIndex, (item, i) => {
      item.tasksListOrder = i;
    });
  }

  async function persistOrder() {
    const itemIds = displayedTasks.map((t) => t._id);
    await reorderTasks(itemIds);
  }

  return {
    get tasks() {
      return displayedTasks;
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
    transformToCare,
    reorder,
    persistOrder,
    getOriginInfo,
  };
}

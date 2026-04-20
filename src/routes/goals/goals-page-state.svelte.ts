import { Temporal } from '@js-temporal/polyfill';
import {
  getAllGoals,
  createGoal,
  updateGoal,
  getGoal,
  removeGoal as removeGoalRepo,
  reorderGoals,
} from '$lib/db/goal-repo';
import {
  getTasksByGoal,
  getTask,
  createTask,
  completeTask,
  uncompleteTask,
  updateTask,
  removeTask as deleteTask,
  reorderGoalTasks,
  assignStepOrder,
} from '$lib/db/task-repo';
import { createCare } from '$lib/db/care-repo';
import { getToastState } from '$lib/components/toast-state.svelte';
import { calculateGoalStatus } from '$lib/engines/goal-engine';
import { reorderItems } from '$lib/utils/reorderItems';
import { snapshotTask, undoDeleteTask } from '$lib/utils/task-undo';
import type { GoalDoc, TaskDoc } from '$lib/types';

function getToday(): string {
  return Temporal.Now.plainDateISO().toString();
}

async function recalcGoalStatus(goalId: string): Promise<void> {
  const goal = await getGoal(goalId);
  const tasks = await getTasksByGoal(goalId);
  const newStatus = calculateGoalStatus(goal, tasks);
  if (goal.status !== newStatus) {
    goal.status = newStatus;
    await updateGoal(goal);
  }
}

export function getGoalsPageState() {
  let goals = $state<GoalDoc[]>([]);
  let newTitle = $state('');
  let loading = $state(true);

  async function load() {
    goals = await getAllGoals();
    loading = false;
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    await createGoal(title);
    newTitle = '';
    await load();
  }

  async function markCompleted(id: string) {
    const goal = await getGoal(id);
    goal.status = 'COMPLETED';
    await updateGoal(goal);
    await load();
  }

  async function recalcStatus(id: string) {
    await recalcGoalStatus(id);
  }

  function reorder(fromIndex: number, toIndex: number) {
    goals = reorderItems(goals, fromIndex, toIndex, (g, i) => {
      g.goalsListOrder = i;
    });
  }

  async function persistOrder() {
    const goalIds = goals.map((g) => g._id);
    await reorderGoals(goalIds);
  }

  return {
    get goals() {
      return goals;
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
    markCompleted,
    recalcStatus,
    reorder,
    persistOrder,
  };
}

function sortWithDoneAtEnd(list: TaskDoc[]): TaskDoc[] {
  return list.toSorted((a, b) => {
    if (a.status === 'DONE' && b.status !== 'DONE') return 1;
    if (a.status !== 'DONE' && b.status === 'DONE') return -1;
    return (a.stepOrder ?? 0) - (b.stepOrder ?? 0);
  });
}

export function getGoalDetailState(goalId: string) {
  let goal = $state<GoalDoc | null>(null);
  let tasks = $state<TaskDoc[]>([]);
  let newTaskTitle = $state('');
  let loading = $state(true);
  let editingTask = $state<TaskDoc | null>(null);
  const toast = getToastState();

  async function load() {
    await assignStepOrder(goalId);
    goal = await getGoal(goalId);
    const raw = await getTasksByGoal(goalId);
    tasks = sortWithDoneAtEnd(raw);
    loading = false;
  }

  async function persistCurrentOrder() {
    const sorted = sortWithDoneAtEnd(tasks);
    sorted.forEach((t, i) => {
      t.stepOrder = i;
    });
    tasks = sorted;
    await reorderGoalTasks(
      goalId,
      sorted.map((t) => t._id),
    );
  }

  async function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    await createTask({ title, doAt: getToday(), goalId });
    newTaskTitle = '';
    await recalcGoalStatus(goalId);
    await load();
    await persistCurrentOrder();
  }

  async function toggleTask(taskId: string) {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;
    if (task.status === 'TODO') {
      await completeTask(taskId);
    } else {
      await uncompleteTask(taskId);
    }
    await recalcGoalStatus(goalId);
    await load();
    await persistCurrentOrder();
  }

  async function markCompleted() {
    const goalDoc = await getGoal(goalId);
    goalDoc.status = 'COMPLETED';
    await updateGoal(goalDoc);
    await load();
  }

  async function deleteGoal() {
    await removeGoalRepo(goalId);
  }

  async function renameGoal(newTitle: string) {
    if (!goal) return;
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === goal.title) return;
    goal.title = trimmed;
    await updateGoal(goal);
    await load();
  }

  function openEdit(taskId: string) {
    const task = tasks.find((t) => t._id === taskId);
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
    await recalcGoalStatus(goalId);
    await load();
    toast.notify('Converted to goal', {
      label: 'Undo',
      fn: async () => {
        await undoDeleteTask(backup);
        await recalcGoalStatus(goalId);
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
    await recalcGoalStatus(goalId);
    await load();
    toast.notify('Converted to care', {
      label: 'Undo',
      fn: async () => {
        await undoDeleteTask(backup);
        await recalcGoalStatus(goalId);
        await load();
      },
    });
  }

  function reorder(fromIndex: number, toIndex: number) {
    tasks = reorderItems(tasks, fromIndex, toIndex, (t, i) => {
      t.stepOrder = i;
    });
  }

  async function persistOrder() {
    await persistCurrentOrder();
  }

  return {
    get goal() {
      return goal;
    },
    get tasks() {
      return tasks;
    },
    get newTaskTitle() {
      return newTaskTitle;
    },
    set newTaskTitle(v: string) {
      newTaskTitle = v;
    },
    get loading() {
      return loading;
    },
    get editingTask() {
      return editingTask;
    },
    load,
    addTask,
    toggleTask,
    markCompleted,
    deleteGoal,
    renameGoal,
    openEdit,
    closeEdit,
    saveEdit,
    transformToGoal,
    transformToCare,
    reorder,
    persistOrder,
  };
}

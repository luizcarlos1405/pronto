import {
  getAllGoals,
  createGoal,
  updateGoal,
  getGoal,
  removeGoal as removeGoalRepo,
  reorderGoals
} from '$lib/db/goal-repo';
import {
  getTasksByGoal,
  createTask,
  completeTask,
  uncompleteTask,
  reorderGoalTasks,
  assignStepOrder
} from '$lib/db/task-repo';
import { calculateGoalStatus } from '$lib/engines/goal-engine';
import { reorderItems } from '$lib/utils/reorderItems';
import type { GoalDoc, TaskDoc } from '$lib/types';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
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
    persistOrder
  };
}

export function getGoalDetailState(goalId: string) {
  let goal = $state<GoalDoc | null>(null);
  let tasks = $state<TaskDoc[]>([]);
  let newTaskTitle = $state('');
  let loading = $state(true);

  async function load() {
    await assignStepOrder(goalId);
    goal = await getGoal(goalId);
    tasks = await getTasksByGoal(goalId);
    loading = false;
  }

  async function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    await createTask({ title, doAt: getToday(), goalId });
    newTaskTitle = '';
    await recalcGoalStatus(goalId);
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
    await recalcGoalStatus(goalId);
    await load();
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

  function reorder(fromIndex: number, toIndex: number) {
    tasks = reorderItems(tasks, fromIndex, toIndex, (t, i) => {
      t.stepOrder = i;
    });
  }

  async function persistOrder() {
    const sortedTasks = tasks.toSorted((a, b) => {
      if (a.status === 'DONE' && b.status !== 'DONE') return 1;
      if (a.status !== 'DONE' && b.status === 'DONE') return -1;
      return (a.stepOrder ?? 0) - (b.stepOrder ?? 0);
    });

    tasks = sortedTasks;

    const sortedTaskIds = sortedTasks.map((t) => t._id);
    await reorderGoalTasks(goalId, sortedTaskIds);
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
    load,
    addTask,
    toggleTask,
    markCompleted,
    deleteGoal,
    reorder,
    persistOrder
  };
}

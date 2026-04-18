import {
  getAllGoals,
  createGoal,
  updateGoal,
  getGoal,
  removeGoal as removeGoalRepo
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
    loading = true;
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
    recalcStatus
  };
}

export function getGoalDetailState(goalId: string) {
  let goal = $state<GoalDoc | null>(null);
  let tasks = $state<TaskDoc[]>([]);
  let newTaskTitle = $state('');
  let loading = $state(true);

  async function load() {
    loading = true;
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
    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reordered.forEach((t, i) => {
      t.stepOrder = i;
    });
    tasks = reordered;
  }

  async function persistOrder() {
    const taskIds = tasks.map((t) => t._id);
    await reorderGoalTasks(goalId, taskIds);
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

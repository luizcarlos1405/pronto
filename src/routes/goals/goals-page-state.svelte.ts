import {
  getAllGoals,
  createGoal,
  updateGoal,
  getGoal,
  removeGoal as removeGoalRepo
} from '$lib/db/goal-repo';
import { getTasksByGoal, createTask, completeTask, uncompleteTask } from '$lib/db/task-repo';
import { calculateGoalStatus } from '$lib/engines/goal-engine';
import type { GoalDoc, TaskDoc } from '$lib/types';

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
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
    const goal = await getGoal(id);
    const tasks = await getTasksByGoal(id);
    const newStatus = calculateGoalStatus(goal, tasks);
    if (goal.status !== newStatus) {
      goal.status = newStatus;
      await updateGoal(goal);
    }
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
    goal = await getGoal(goalId);
    tasks = await getTasksByGoal(goalId);
    loading = false;
  }

  async function addTask() {
    const title = newTaskTitle.trim();
    if (!title) return;
    await createTask({ title, doAt: getToday(), goalId });
    newTaskTitle = '';
    await load();
    const { recalcStatus } = getGoalsPageState();
    await recalcStatus(goalId);
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
    const { recalcStatus } = getGoalsPageState();
    await recalcStatus(goalId);
    await load();
  }

  async function markCompleted() {
    const { markCompleted: mc } = getGoalsPageState();
    await mc(goalId);
    await load();
  }

  async function deleteGoal() {
    await removeGoalRepo(goalId);
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
    deleteGoal
  };
}

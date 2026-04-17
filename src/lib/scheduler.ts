import { Temporal } from '@js-temporal/polyfill';
import { getDb } from './db/database';
import { getAllCares, updateCare } from './db/care-repo';
import { createTask, getTasksByTaskPlan } from './db/task-repo';
import { runScheduler } from './engines/care-engine';

export async function runSchedulerNow(): Promise<number> {
  const today = Temporal.Now.plainDateISO();
  const cares = await getAllCares();
  const allPlanIds = cares.flatMap((c) => c.taskPlans.map((tp) => tp._id));
  const tasksByPlan = new Map<string, import('$lib/types').TaskDoc[]>();
  await Promise.all(
    allPlanIds.map(async (planId) => {
      tasksByPlan.set(planId, await getTasksByTaskPlan(planId));
    })
  );
  const { tasks, updatedPlans } = runScheduler(
    cares,
    today,
    (planId) => tasksByPlan.get(planId) ?? []
  );

  for (const task of tasks) {
    await createTask({
      title: task.title,
      doAt: task.doAt,
      careId: task.careId,
      taskPlanId: task.taskPlanId
    });
  }

  for (const care of cares) {
    let modified = false;
    const updated = {
      ...care,
      taskPlans: care.taskPlans.map((tp) => {
        const updatedPlan = updatedPlans.get(tp._id);
        if (updatedPlan) {
          modified = true;
          return updatedPlan;
        }
        return tp;
      })
    };
    if (modified) {
      await updateCare(updated);
    }
  }

  return tasks.length;
}

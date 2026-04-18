import { Temporal } from '@js-temporal/polyfill';
import { createInboxItem, markProcessed } from './db/inbox-repo';
import { createGoal, updateGoal } from './db/goal-repo';
import { createTask, completeTask, updateTask } from './db/task-repo';
import { createCare, updateCare } from './db/care-repo';
import { runSchedulerNow } from './scheduler';

function daysAgo(n: number): string {
  return Temporal.Now.plainDateISO().subtract({ days: n }).toString();
}

function daysFromNow(n: number): string {
  return Temporal.Now.plainDateISO().add({ days: n }).toString();
}

function todayStr(): string {
  return Temporal.Now.plainDateISO().toString();
}

function pastISOString(daysAgoVal: number): string {
  const d = Temporal.Now.plainDateISO().subtract({ days: daysAgoVal });
  return `${d.toString()}T10:30:00.000Z`;
}

export async function addSampleData() {
  const summary = { inboxItems: 0, goals: 0, tasks: 0, cares: 0 };

  console.log('Populating sample data...');

  // Inbox — unprocessed
  await createInboxItem('Look into that new productivity book');
  await createInboxItem('Call plumber about kitchen sink');
  await createInboxItem('Ideas for birthday gift for Mom');
  summary.inboxItems += 3;

  // Inbox — processed
  const inbox1 = await createInboxItem('Research meal prep containers');
  await markProcessed(inbox1._id);
  const inbox2 = await createInboxItem('Schedule dentist appointment');
  await markProcessed(inbox2._id);
  const inbox3 = await createInboxItem('Check warranty on laptop');
  await markProcessed(inbox3._id);
  summary.inboxItems += 3;

  // Goal 1: "Run a half marathon" — IN_PROGRESS
  const goal1 = await createGoal('Run a half marathon');
  summary.goals++;

  const g1t1 = await createTask({
    title: 'Research training plans',
    doAt: daysAgo(14),
    goalId: goal1._id
  });
  await completeAndBackdate(g1t1._id, 12);
  summary.tasks++;

  const g1t2 = await createTask({
    title: 'Buy running shoes',
    doAt: daysAgo(10),
    goalId: goal1._id
  });
  await completeAndBackdate(g1t2._id, 8);
  summary.tasks++;

  await createTask({ title: 'Complete week 4 long run', doAt: todayStr(), goalId: goal1._id });
  summary.tasks++;

  goal1.status = 'IN_PROGRESS';
  await updateGoal(goal1);

  // Goal 2: "Organize home office" — REVIEW (all tasks done)
  const goal2 = await createGoal('Organize home office');
  summary.goals++;

  const g2t1 = await createTask({ title: 'Declutter desk', doAt: daysAgo(7), goalId: goal2._id });
  await completeAndBackdate(g2t1._id, 6);
  summary.tasks++;

  const g2t2 = await createTask({
    title: 'Buy cable organizers',
    doAt: daysAgo(5),
    goalId: goal2._id
  });
  await completeAndBackdate(g2t2._id, 4);
  summary.tasks++;

  const g2t3 = await createTask({
    title: 'Set up monitor arm',
    doAt: daysAgo(3),
    goalId: goal2._id
  });
  await completeAndBackdate(g2t3._id, 2);
  summary.tasks++;

  goal2.status = 'REVIEW';
  await updateGoal(goal2);

  // Goal 3: "Learn Spanish basics" — IN_PROGRESS
  const goal3 = await createGoal('Learn Spanish basics');
  summary.goals++;

  const g3t1 = await createTask({
    title: 'Download Duolingo',
    doAt: daysAgo(20),
    goalId: goal3._id
  });
  await completeAndBackdate(g3t1._id, 18);
  summary.tasks++;

  const g3t2 = await createTask({ title: 'Complete unit 1', doAt: daysAgo(10), goalId: goal3._id });
  await completeAndBackdate(g3t2._id, 8);
  summary.tasks++;

  await createTask({ title: 'Practice 15 min daily', doAt: todayStr(), goalId: goal3._id });
  summary.tasks++;
  await createTask({
    title: 'Watch Spanish movie with subtitles',
    doAt: daysFromNow(5),
    goalId: goal3._id
  });
  summary.tasks++;

  goal3.status = 'IN_PROGRESS';
  await updateGoal(goal3);

  // Goal 4: "Plan summer vacation" — NOT_STARTED, no tasks
  await createGoal('Plan summer vacation');
  summary.goals++;

  // Standalone tasks
  await createTask({ title: "Reply to Sarah's email", doAt: daysAgo(2) });
  summary.tasks++;
  await createTask({ title: 'Pick up dry cleaning', doAt: daysAgo(1) });
  summary.tasks++;
  await createTask({ title: 'Renew gym membership', doAt: todayStr() });
  summary.tasks++;
  await createTask({ title: 'Book haircut appointment', doAt: daysFromNow(3) });
  summary.tasks++;

  const standaloneDone1 = await createTask({ title: 'Grocery shopping', doAt: todayStr() });
  await completeTask(standaloneDone1._id);
  summary.tasks++;
  const standaloneDone2 = await createTask({
    title: 'Drop off package at post office',
    doAt: todayStr()
  });
  await completeTask(standaloneDone2._id);
  summary.tasks++;

  // Care 1: House plants
  const care1 = await createCare('House plants', [
    {
      title: 'Water plants',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { days: 3 },
        startDate: daysAgo(14)
      },
      lastDoAtDate: daysAgo(3)
    }
  ]);
  summary.cares++;

  // Care 2: Pet care
  const care2 = await createCare('Pet care', [
    {
      title: 'Feed the cat',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'AFTER_DONE',
        interval: { days: 1 },
        startDate: daysAgo(30)
      }
    },
    {
      title: 'Clean litter box',
      recurrence: {
        type: 'FIXED_DAYS',
        subtype: 'WEEKDAYS',
        daysOfWeek: [3, 6],
        startDate: daysAgo(30)
      }
    }
  ]);
  summary.cares++;

  // Care 3: Car maintenance
  const care3 = await createCare('Car maintenance', [
    {
      title: 'Check tire pressure',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: { weeks: 2 },
        startDate: daysAgo(60)
      },
      lastDoAtDate: daysAgo(12)
    },
    {
      title: 'Oil change',
      recurrence: {
        type: 'INTERVAL',
        subtype: 'AFTER_DONE',
        interval: { months: 6 },
        startDate: daysAgo(240)
      },
      lastDoneDate: daysAgo(150)
    }
  ]);
  summary.cares++;

  // Create a completed care-generated task for "Water plants" to show history
  const care1PlanId = care1.taskPlans[0]._id;
  const careTaskDone = await createTask({
    title: 'Water plants',
    doAt: daysAgo(3),
    careId: care1._id,
    taskPlanId: care1PlanId
  });
  await completeAndBackdate(careTaskDone._id, 2);
  summary.tasks++;

  // Create a completed task for "Feed the cat"
  const care2PlanId = care2.taskPlans[0]._id;
  const feedDone = await createTask({
    title: 'Feed the cat',
    doAt: daysAgo(1),
    careId: care2._id,
    taskPlanId: care2PlanId
  });
  await completeAndBackdate(feedDone._id, 0);
  summary.tasks++;

  // Create a completed tire pressure check
  const care3PlanId = care3.taskPlans[0]._id;
  const tireDone = await createTask({
    title: 'Check tire pressure',
    doAt: daysAgo(12),
    careId: care3._id,
    taskPlanId: care3PlanId
  });
  await completeAndBackdate(tireDone._id, 11);
  summary.tasks++;

  // Run scheduler to generate recurring tasks from cares
  const generated = await runSchedulerNow();
  summary.tasks += generated;

  console.log('Sample data populated:', summary);
  return summary;
}

async function completeAndBackdate(taskId: string, daysAgoCompleted: number): Promise<void> {
  const doc = await completeTask(taskId);
  doc.completedAt = pastISOString(daysAgoCompleted);
  await updateTask(doc);
}

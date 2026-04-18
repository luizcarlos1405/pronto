import {
  getAllCares,
  createCare,
  removeTaskPlan as removeTaskPlanRepo,
  removeCare as removeCareRepo,
  getCare,
  updateCare,
  updateTaskPlan as updateTaskPlanRepo,
  reorderCares as reorderCaresRepo,
  reorderTaskPlans as reorderTaskPlansRepo
} from '$lib/db/care-repo';
import { SvelteDate } from 'svelte/reactivity';
import { reorderItems } from '$lib/utils/reorderItems';
import type { CareDoc, TaskPlan, Recurrence } from '$lib/types';

export function getCaresPageState() {
  let cares = $state<CareDoc[]>([]);
  let newTitle = $state('');
  let loading = $state(true);

  async function load() {
    cares = await getAllCares();
    loading = false;
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    await createCare(title, []);
    newTitle = '';
    await load();
  }

  function reorder(fromIndex: number, toIndex: number) {
    cares = reorderItems(cares, fromIndex, toIndex, (c, i) => {
      c.caresListOrder = i;
    });
  }

  async function persistOrder() {
    const careIds = cares.map((c) => c._id);
    await reorderCaresRepo(careIds);
  }

  return {
    get cares() {
      return cares;
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
    reorder,
    persistOrder
  };
}

export function getCareDetailState(careId: string) {
  let care = $state<CareDoc | null>(null);
  let loading = $state(true);
  let showWizard = $state(false);

  async function load() {
    care = await getCare(careId);
    loading = false;
  }

  async function removeTaskPlan(planId: string) {
    await removeTaskPlanRepo(careId, planId);
    await load();
  }

  async function deleteCare() {
    await removeCareRepo(careId);
  }

  async function addTaskPlan(plan: { title: string; recurrence: Recurrence }) {
    const doc = await getCare(careId);
    const now = new SvelteDate().toISOString();
    const { nanoid } = await import('nanoid');
    doc.taskPlans.push({
      _id: `tp_${nanoid()}`,
      title: plan.title,
      recurrence: plan.recurrence,
      createdAt: now,
      updatedAt: now
    });
    await updateCare(doc);
    showWizard = false;
    await load();
  }

  function reorderPlans(fromIndex: number, toIndex: number) {
    if (!care) return;
    const plans = [...care.taskPlans];
    care.taskPlans = reorderItems(plans, fromIndex, toIndex, (_p, i) => {});
  }

  async function persistPlansOrder() {
    if (!care) return;
    const planIds = care.taskPlans.map((tp) => tp._id);
    await reorderTaskPlansRepo(careId, planIds);
  }

  return {
    get care() {
      return care;
    },
    get loading() {
      return loading;
    },
    get showWizard() {
      return showWizard;
    },
    set showWizard(v: boolean) {
      showWizard = v;
    },
    load,
    deleteCare,
    removeTaskPlan,
    addTaskPlan,
    reorderPlans,
    persistPlansOrder
  };
}

export function getTaskPlanEditState(careId: string, planId: string) {
  let care = $state<CareDoc | null>(null);
  let loading = $state(true);

  const plan = $derived(care?.taskPlans.find((tp) => tp._id === planId) ?? null);

  async function load() {
    care = await getCare(careId);
    loading = false;
  }

  async function update(updates: { title: string; recurrence: Recurrence }) {
    await updateTaskPlanRepo(careId, planId, updates);
    await load();
  }

  async function deletePlan() {
    await removeTaskPlanRepo(careId, planId);
  }

  return {
    get care() {
      return care;
    },
    get plan() {
      return plan;
    },
    get loading() {
      return loading;
    },
    load,
    update,
    deletePlan
  };
}

export function describeRecurrence(r: Recurrence): string {
  if (r.type === 'INTERVAL' && r.subtype === 'FIXED') {
    return describeInterval(r.interval);
  }
  if (r.type === 'INTERVAL' && r.subtype === 'AFTER_DONE') {
    return `${describeInterval(r.interval)} after last time you did it`;
  }
  if (r.type === 'FIXED_DAYS' && r.subtype === 'WEEKDAYS') {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `Every ${r.daysOfWeek.map((d) => names[d]).join(' and ')}`;
  }
  if (r.type === 'FIXED_DAYS' && r.subtype === 'MONTHDAYS') {
    const suffix = (n: number) => {
      if (n === 1 || n === 21 || n === 31) return 'st';
      if (n === 2 || n === 22) return 'nd';
      if (n === 3 || n === 23) return 'rd';
      return 'th';
    };
    return `Every ${r.daysOfMonth.map((d) => `${d}${suffix(d)}`).join(' and ')} of the month`;
  }
  if (r.type === 'FIXED_DAYS' && r.subtype === 'YEARDAYS') {
    const months = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return r.dates.map(({ month, day }) => `${months[month]} ${day}`).join(' and ');
  }
  return 'Unknown schedule';
}

function describeInterval(d: {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
}): string {
  const parts: string[] = [];
  if (d.years) parts.push(`${d.years} year${d.years > 1 ? 's' : ''}`);
  if (d.months) parts.push(`${d.months} month${d.months > 1 ? 's' : ''}`);
  if (d.weeks) parts.push(`${d.weeks} week${d.weeks > 1 ? 's' : ''}`);
  if (d.days) parts.push(`${d.days} day${d.days > 1 ? 's' : ''}`);
  return parts.join(' and ');
}

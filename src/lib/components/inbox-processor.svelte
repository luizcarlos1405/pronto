<script lang="ts">
  import { getInboxProcessorState, type CreatedEntity } from './inbox-processor-state.svelte';
  import type { InboxItemDoc, Recurrence } from '$lib/types';
  import { Temporal } from '@js-temporal/polyfill';
  import SquareCheckBig from 'lucide-svelte/icons/square-check-big';
  import Target from 'lucide-svelte/icons/target';
  import Heart from 'lucide-svelte/icons/heart';
  import Plus from 'lucide-svelte/icons/plus';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';

  let { open, inboxItem, onDone }: { open: boolean; inboxItem?: InboxItemDoc; onDone: () => void } =
    $props();

  let ctrl = $state<ReturnType<typeof getInboxProcessorState> | null>(null);

  $effect(() => {
    if (inboxItem) {
      ctrl = getInboxProcessorState(inboxItem);
    } else {
      ctrl = null;
    }
  });

  let carePlanTitle: string = $state('');
  let carePlanInterval: { years: number; months: number; weeks: number; days: number } = $state({
    years: 0,
    months: 0,
    weeks: 0,
    days: 0
  });
  let showCarePlan = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (!ctrl) return;
    if (e.key === 'Enter') {
      if (ctrl.mode === 'task') ctrl.createTask();
      else if (ctrl.mode === 'goal') ctrl.createGoal();
    }
  }

  async function handleFinish() {
    if (!ctrl) return;
    await ctrl.finish();
    onDone();
  }

  async function handleAddCarePlan() {
    if (!ctrl) return;
    const interval = carePlanInterval;
    const total = interval.years + interval.months + interval.weeks + interval.days;
    if (!carePlanTitle.trim() || total <= 0) return;
    const recurrence: Recurrence = {
      type: 'INTERVAL',
      subtype: 'FIXED',
      interval,
      startDate: Temporal.Now.plainDateISO().toString()
    };
    await ctrl.createCare([{ title: carePlanTitle.trim(), recurrence }]);
    carePlanTitle = '';
    carePlanInterval = { years: 0, months: 0, weeks: 0, days: 0 };
    showCarePlan = false;
  }
  const entityIcon: Record<string, typeof SquareCheckBig> = {
    task: SquareCheckBig,
    goal: Target,
    care: Heart
  };
  const entityLabel: Record<string, string> = {
    task: 'Task',
    goal: 'Goal',
    care: 'Care'
  };
</script>

<dialog class="modal modal-bottom" class:modal-open={open}>
  {#if ctrl}
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-1">Process inbox item</h3>
      <p class="text-base-content/60 mb-4">{inboxItem!.title}</p>

      {#if ctrl.created.length > 0}
        <div class="mb-4">
          <p class="text-sm font-semibold text-base-content/60 uppercase mb-1">Added</p>
          {#each ctrl.created as entity (entity.title + entity.type)}
            <div class="badge badge-sm badge-success gap-1 mr-1">
              {entityLabel[entity.type]}: {entity.title}
            </div>
          {/each}
        </div>
      {/if}

      {#if ctrl.mode === 'choose'}
        <div class="flex flex-col gap-2">
          <button class="btn btn-outline btn-sm" onclick={() => (ctrl!.mode = 'task')}>
            <SquareCheckBig class="size-4" /> Add task
          </button>
          <button class="btn btn-outline btn-sm" onclick={() => (ctrl!.mode = 'goal')}>
            <Target class="size-4" /> Add goal
          </button>
          <button class="btn btn-outline btn-sm" onclick={() => (ctrl!.mode = 'care')}>
            <Heart class="size-4" /> Add care
          </button>
        </div>
      {:else if ctrl.mode === 'task'}
        <div class="flex flex-col gap-2">
          <input
            type="text"
            class="input input-sm"
            placeholder="Task title"
            bind:value={ctrl.taskTitle}
            onkeydown={handleKeydown}
          />
          <input type="date" class="input input-sm" bind:value={ctrl.taskDoAt} />
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" onclick={ctrl.resetMode}>Back</button>
            <div class="flex-1"></div>
            <button
              class="btn btn-primary btn-sm"
              onclick={ctrl.createTask}
              disabled={ctrl.processing || !ctrl.taskTitle.trim()}
            >
              {#if ctrl.processing}<LoaderCircle class="size-4 animate-spin" />{:else}<Plus
                  class="size-4"
                />{/if}
              Add task
            </button>
          </div>
        </div>
      {:else if ctrl.mode === 'goal'}
        <div class="flex flex-col gap-2">
          <input
            type="text"
            class="input input-sm"
            placeholder="Goal title"
            bind:value={ctrl.goalTitle}
            onkeydown={handleKeydown}
          />
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" onclick={ctrl.resetMode}>Back</button>
            <div class="flex-1"></div>
            <button
              class="btn btn-primary btn-sm"
              onclick={ctrl.createGoal}
              disabled={ctrl.processing || !ctrl.goalTitle.trim()}
            >
              {#if ctrl.processing}<LoaderCircle class="size-4 animate-spin" />{:else}<Plus
                  class="size-4"
                />{/if}
              Add goal
            </button>
          </div>
        </div>
      {:else if ctrl.mode === 'care'}
        <div class="flex flex-col gap-2">
          <input
            type="text"
            class="input input-sm"
            placeholder="Care title"
            bind:value={ctrl.careTitle}
          />

          {#if ctrl.created.some((e) => e.type === 'care')}
            <p class="text-xs text-success">
              Care added. You can add task plans from the Cares page.
            </p>
          {:else if !showCarePlan}
            <button class="btn btn-ghost btn-sm" onclick={() => (showCarePlan = true)}>
              <Plus class="size-4" /> Add a task plan
            </button>
          {:else}
            <div class="bg-base-200 rounded-lg p-3 flex flex-col gap-2">
              <input
                type="text"
                class="input input-sm"
                placeholder="Plan title"
                bind:value={carePlanTitle}
              />
              <div class="flex gap-1 flex-wrap">
                {#each [{ key: 'years' as const, label: 'Y' }, { key: 'months' as const, label: 'M' }, { key: 'weeks' as const, label: 'W' }, { key: 'days' as const, label: 'D' }] as field (field.key)}
                  <label class="input input-sm flex items-center gap-1">
                    <span class="text-xs">{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      class="w-10"
                      bind:value={carePlanInterval[field.key]}
                    />
                  </label>
                {/each}
              </div>
              <button class="btn btn-sm" onclick={handleAddCarePlan}>Add plan</button>
            </div>
          {/if}

          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" onclick={ctrl.resetMode}>Back</button>
            <div class="flex-1"></div>
            <button
              class="btn btn-primary btn-sm"
              onclick={() => ctrl!.createCare([])}
              disabled={ctrl.processing || !ctrl.careTitle.trim()}
            >
              {#if ctrl.processing}<LoaderCircle class="size-4 animate-spin" />{:else}<Plus
                  class="size-4"
                />{/if}
              Add care
            </button>
          </div>
        </div>
      {/if}

      <div class="modal-action">
        <button class="btn btn-ghost btn-sm" onclick={onDone}>Cancel</button>
        <button
          class="btn {ctrl.created.length > 0 ? 'btn-success' : 'btn-primary'} btn-sm"
          onclick={handleFinish}
          disabled={ctrl.processing}
        >
          {ctrl.created.length > 0 ? 'Done' : 'Discard'}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button onclick={onDone}>close</button></form>
  {/if}
</dialog>

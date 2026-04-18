<script lang="ts">
  import { getCareDetailState, describeRecurrence } from '../cares-page-state.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Check from 'lucide-svelte/icons/check';
  import { tick } from 'svelte';
  import type { Recurrence } from '$lib/types';
  import { goto } from '$app/navigation';
  import { getConfirmState } from '$lib/components/confirm-state.svelte';
  import { orderableChildren } from '$lib/attachments/orderableChildren';
  import { flip } from 'svelte/animate';

  const careId = page.params.id!;
  const ctrl = getCareDetailState(careId);
  const intervalFields = [
    { key: 'years' as const, label: 'Years' },
    { key: 'months' as const, label: 'Months' },
    { key: 'weeks' as const, label: 'Weeks' },
    { key: 'days' as const, label: 'Days' }
  ];

  let isDragging = $state(false);
  let editingTitle = $state(false);
  let draftTitle = $state('');
  let titleInput: HTMLInputElement | undefined = $state();

  async function startEditTitle() {
    if (!ctrl.care) return;
    draftTitle = ctrl.care.title;
    editingTitle = true;
    await tick();
    titleInput?.focus();
    titleInput?.select();
  }

  function saveTitle() {
    if (!ctrl.care) return;
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== ctrl.care.title) {
      ctrl.renameCare(trimmed);
    }
    editingTitle = false;
  }

  function cancelTitle() {
    editingTitle = false;
  }

  onMount(() => ctrl.load());

  async function handleDelete() {
    if (await getConfirmState().confirm({ message: 'Remove this care and all its task plans?' })) {
      await ctrl.deleteCare();
      goto(resolve('/cares'));
    }
  }

  let newPlanTitle: string = $state('');
  let planStep: number = $state(0);
  let planType: 'INTERVAL_FIXED' | 'INTERVAL_AFTER_DONE' | 'FIXED_DAYS' = $state('INTERVAL_FIXED');
  let planInterval: { years: number; months: number; weeks: number; days: number } = $state({
    years: 0,
    months: 0,
    weeks: 0,
    days: 0
  });
  let planDaysSubtype: 'WEEKDAYS' | 'MONTHDAYS' | 'YEARDAYS' = $state('WEEKDAYS');
  let planDaysOfWeek: number[] = $state([]);
  let planDaysOfMonth: number[] = $state([]);
  let planYearDates: { month: number; day: number }[] = $state([]);
  let planStartDate: string = $state(new Date().toISOString().slice(0, 10));

  function resetWizard() {
    newPlanTitle = '';
    planStep = 0;
    planType = 'INTERVAL_FIXED';
    planInterval = { years: 0, months: 0, weeks: 0, days: 0 };
    planDaysSubtype = 'WEEKDAYS';
    planDaysOfWeek = [];
    planDaysOfMonth = [];
    planYearDates = [];
    planStartDate = new Date().toISOString().slice(0, 10);
  }

  function buildRecurrence(): Recurrence {
    if (planType === 'INTERVAL_FIXED') {
      return {
        type: 'INTERVAL',
        subtype: 'FIXED',
        interval: planInterval,
        startDate: planStartDate
      };
    }
    if (planType === 'INTERVAL_AFTER_DONE') {
      return {
        type: 'INTERVAL',
        subtype: 'AFTER_DONE',
        interval: planInterval,
        startDate: planStartDate
      };
    }
    if (planDaysSubtype === 'WEEKDAYS') {
      return {
        type: 'FIXED_DAYS',
        subtype: 'WEEKDAYS',
        daysOfWeek: planDaysOfWeek,
        startDate: planStartDate
      };
    }
    if (planDaysSubtype === 'MONTHDAYS') {
      return {
        type: 'FIXED_DAYS',
        subtype: 'MONTHDAYS',
        daysOfMonth: planDaysOfMonth,
        startDate: planStartDate
      };
    }
    return {
      type: 'FIXED_DAYS',
      subtype: 'YEARDAYS',
      dates: planYearDates,
      startDate: planStartDate
    };
  }

  function canCreate(): boolean {
    if (!newPlanTitle.trim()) return false;
    if (planType.startsWith('INTERVAL')) {
      const { years, months, weeks, days } = planInterval;
      return (years ?? 0) + (months ?? 0) + (weeks ?? 0) + (days ?? 0) > 0;
    }
    if (planDaysSubtype === 'WEEKDAYS') return planDaysOfWeek.length > 0;
    if (planDaysSubtype === 'MONTHDAYS') return planDaysOfMonth.length > 0;
    return planYearDates.length > 0;
  }

  async function handleCreate() {
    await ctrl.addTaskPlan({ title: newPlanTitle.trim(), recurrence: buildRecurrence() });
    resetWizard();
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="p-4">
  <div class="flex justify-between mb-2">
    <a href={resolve('/cares')} class="btn btn-ghost btn-sm">
      <ArrowLeft class="size-4" />
      Back
    </a>
    {#if ctrl.care}
      <button class="btn btn-ghost btn-sm text-error" onclick={handleDelete}>
        <Trash2 class="size-4" />
        Delete
      </button>
    {/if}
  </div>

  {#if ctrl.loading}
    <div class="flex justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if ctrl.care}
    <div class="flex items-center gap-2 mb-4">
      {#if editingTitle}
        <input
          bind:this={titleInput}
          type="text"
          class="input input-sm text-2xl font-bold flex-1"
          bind:value={draftTitle}
          onkeydown={(e) => {
            if (e.key === 'Enter') saveTitle();
            if (e.key === 'Escape') cancelTitle();
          }}
          onblur={() => setTimeout(cancelTitle, 0)}
        />
        <button class="btn btn-ghost btn-sm" onmousedown={saveTitle}>
          <Check class="size-4" />
        </button>
      {:else}
        <h1 class="text-2xl font-bold flex-1">{ctrl.care.title}</h1>
        <button class="btn btn-ghost btn-sm" onclick={startEditTitle}>
          <Pencil class="size-4" />
        </button>
      {/if}
    </div>

    {#if ctrl.care.taskPlans.length > 0}
      <h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">Task plans</h2>
      <ul
        class="list mb-6"
        {@attach orderableChildren({
          startEvents: ['mousedown', 'touchstart'],
          handleSelector: '.drag-handle',
          onStart: () => {
            isDragging = true;
          },
          onEnd: () => {
            isDragging = false;
            ctrl.persistPlansOrder();
          },
          onMove: ({ fromIndex, toIndex }) => {
            ctrl.reorderPlans(fromIndex, toIndex);
          }
        })}
      >
        {#each ctrl.care.taskPlans as plan (plan._id)}
          <li class="list-row bg-base-100 w-full" animate:flip={{ duration: 200 }}>
            <a href={resolve(`/cares/${careId}/plans/${plan._id}`)} class="list-col-grow">
              <div class="font-medium">{plan.title}</div>
              <div class="text-xs text-base-content/50">{describeRecurrence(plan.recurrence)}</div>
              {#if plan.lastDoAtDate}
                <div class="text-xs text-base-content/40">Last generated: {plan.lastDoAtDate}</div>
              {/if}
            </a>
            <div
              class:cursor-grab={!isDragging}
              class:cursor-grabbing={isDragging}
              class="drag-handle flex pr-2 ml-auto items-center"
            >
              <GripVertical class="size-6 text-base-content/30" />
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-base-content/50 text-center py-4 mb-4">
        No task plans yet. Add one to get started.
      </p>
    {/if}

    {#if !ctrl.showWizard}
      <button
        class="btn btn-primary btn-sm"
        onclick={() => {
          resetWizard();
          ctrl.showWizard = true;
        }}
      >
        <Plus class="size-4" />
        Add task plan
      </button>
    {:else}
      <div class="card card-border bg-base-200 mt-4">
        <div class="card-body p-4 gap-3">
          <h3 class="font-semibold">New task plan</h3>

          {#if planStep >= 0}
            <label class="label" for="plan-title">
              <span class="label-text">Task title</span>
            </label>
            <input
              id="plan-title"
              type="text"
              class="input input-sm"
              placeholder="e.g. Water plants"
              bind:value={newPlanTitle}
            />
          {/if}

          {#if planStep >= 1}
            <label class="label" for="plan-schedule-type">
              <span class="label-text">Schedule type</span>
            </label>
            <select id="plan-schedule-type" class="select select-sm" bind:value={planType}>
              <option value="INTERVAL_FIXED">Fixed interval (e.g. every 2 weeks)</option>
              <option value="INTERVAL_AFTER_DONE">After completion (e.g. 3 days after done)</option>
              <option value="FIXED_DAYS">Specific days</option>
            </select>
          {/if}

          {#if planStep >= 2}
            {#if planType.startsWith('INTERVAL')}
              <label class="label" for="plan-interval">
                <span class="label-text">Interval</span>
              </label>
              <div class="grid grid-cols-2 gap-2 flex-wrap">
                {#each intervalFields as field (field.key)}
                  <label class="input input-sm flex items-center gap-1">
                    <span class="text-xs">{field.label}</span>
                    <input
                      type="number"
                      min="0"
                      class="w-full"
                      bind:value={planInterval[field.key]}
                    />
                  </label>
                {/each}
              </div>
            {:else}
              <label class="label" for="plan-day-type">
                <span class="label-text">Day type</span>
              </label>
              <select id="plan-day-type" class="select select-sm" bind:value={planDaysSubtype}>
                <option value="WEEKDAYS">Days of the week</option>
                <option value="MONTHDAYS">Days of the month</option>
                <option value="YEARDAYS">Specific dates</option>
              </select>
            {/if}
          {/if}

          {#if planStep >= 3 && planType === 'FIXED_DAYS'}
            {#if planDaysSubtype === 'WEEKDAYS'}
              <div class="flex flex-wrap gap-1">
                {#each dayNames as name, i (i)}
                  <button
                    class="btn btn-sm {planDaysOfWeek.includes(i) ? 'btn-primary' : 'btn-ghost'}"
                    onclick={() => {
                      if (planDaysOfWeek.includes(i)) {
                        planDaysOfWeek = planDaysOfWeek.filter((d) => d !== i);
                      } else {
                        planDaysOfWeek = [...planDaysOfWeek, i];
                      }
                    }}
                  >
                    {name}
                  </button>
                {/each}
              </div>
            {:else if planDaysSubtype === 'MONTHDAYS'}
              <input
                type="text"
                class="input input-sm"
                placeholder="Days: 1, 15, 31"
                value={planDaysOfMonth.join(', ')}
                oninput={(e) => {
                  planDaysOfMonth = (e.target as HTMLInputElement).value
                    .split(',')
                    .map((s) => parseInt(s.trim()))
                    .filter((n) => n >= 1 && n <= 31);
                }}
              />
            {:else}
              <input
                type="text"
                class="input input-sm"
                placeholder="Dates: 12-25, 7-4"
                value={planYearDates.map(({ month, day }) => `${month}-${day}`).join(', ')}
                oninput={(e) => {
                  planYearDates = (e.target as HTMLInputElement).value
                    .split(',')
                    .map((s) => {
                      const parts = s.trim().split('-');
                      return { month: parseInt(parts[0]), day: parseInt(parts[1]) };
                    })
                    .filter(({ month, day }) => month >= 1 && month <= 12 && day >= 1 && day <= 31);
                }}
              />
            {/if}
          {/if}

          {#if planStep >= 4}
            <label class="label" for="plan-start-date">
              <span class="label-text">Start date</span>
            </label>
            <input
              id="plan-start-date"
              type="date"
              class="input input-sm"
              bind:value={planStartDate}
            />
          {/if}

          <div class="flex gap-2 mt-2">
            <button
              class="btn btn-ghost btn-sm"
              onclick={() => {
                ctrl.showWizard = false;
                resetWizard();
              }}>Cancel</button
            >
            <div class="flex-1"></div>
            {#if planStep > 0}
              <button class="btn btn-ghost btn-sm" onclick={() => planStep--}>Back</button>
            {/if}
            {#if planStep < 4}
              <button class="btn btn-sm" onclick={() => planStep++}>Next</button>
            {/if}
            {#if planStep === 4}
              <button class="btn btn-primary btn-sm" disabled={!canCreate()} onclick={handleCreate}>
                Add
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<script lang="ts">
  import { getTaskPlanEditState, describeRecurrence } from '../../../cares-page-state.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import Save from 'lucide-svelte/icons/save';
  import type { Recurrence } from '$lib/types';
  import { goto } from '$app/navigation';
  import { getConfirmState } from '$lib/components/confirm-state.svelte';

  const careId = page.params.id!;
  const planId = page.params.planId!;
  const ctrl = getTaskPlanEditState(careId, planId);
  const intervalFields = [
    { key: 'years' as const, label: 'Years' },
    { key: 'months' as const, label: 'Months' },
    { key: 'weeks' as const, label: 'Weeks' },
    { key: 'days' as const, label: 'Days' }
  ];

  let title: string = $state('');
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
  let planStartDate: string = $state('');
  let initialized = $state(false);

  onMount(() => ctrl.load());

  $effect(() => {
    const plan = ctrl.plan;
    if (plan && !initialized) {
      initialized = true;
      title = plan.title;
      planStartDate = plan.recurrence.startDate;

      if (plan.recurrence.type === 'INTERVAL' && plan.recurrence.subtype === 'FIXED') {
        planType = 'INTERVAL_FIXED';
        planInterval = { ...plan.recurrence.interval } as {
          years: number;
          months: number;
          weeks: number;
          days: number;
        };
      } else if (plan.recurrence.type === 'INTERVAL' && plan.recurrence.subtype === 'AFTER_DONE') {
        planType = 'INTERVAL_AFTER_DONE';
        planInterval = { ...plan.recurrence.interval } as {
          years: number;
          months: number;
          weeks: number;
          days: number;
        };
      } else if (plan.recurrence.type === 'FIXED_DAYS') {
        planType = 'FIXED_DAYS';
        planDaysSubtype = plan.recurrence.subtype;
        if (plan.recurrence.subtype === 'WEEKDAYS') {
          planDaysOfWeek = [...plan.recurrence.daysOfWeek];
        } else if (plan.recurrence.subtype === 'MONTHDAYS') {
          planDaysOfMonth = [...plan.recurrence.daysOfMonth];
        } else {
          planYearDates = plan.recurrence.dates.map((d: { month: number; day: number }) => ({
            ...d
          }));
        }
      }
    }
  });

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

  function canSave(): boolean {
    if (!title.trim()) return false;
    if (planType.startsWith('INTERVAL')) {
      const { years, months, weeks, days } = planInterval;
      return (years ?? 0) + (months ?? 0) + (weeks ?? 0) + (days ?? 0) > 0;
    }
    if (planDaysSubtype === 'WEEKDAYS') return planDaysOfWeek.length > 0;
    if (planDaysSubtype === 'MONTHDAYS') return planDaysOfMonth.length > 0;
    return planYearDates.length > 0;
  }

  async function handleSave() {
    await ctrl.update({ title: title.trim(), recurrence: buildRecurrence() });
    goto(resolve(`/cares/${careId}`));
  }

  async function handleDelete() {
    if (await getConfirmState().confirm({ message: 'Remove this task plan?' })) {
      await ctrl.deletePlan();
      goto(resolve(`/cares/${careId}`));
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="p-4">
  <div class="flex justify-between mb-2">
    <a href={resolve(`/cares/${careId}`)} class="btn btn-ghost btn-sm">
      <ArrowLeft class="size-4" />
      Back
    </a>
    {#if ctrl.plan}
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
  {:else if ctrl.plan}
    <h1 class="text-2xl font-bold mb-4">{ctrl.plan.title}</h1>

    <div class="card card-border bg-base-200">
      <div class="card-body p-4 gap-3">
        <label class="label" for="plan-title">
          <span class="label-text">Task title</span>
        </label>
        <input
          id="plan-title"
          type="text"
          class="input input-sm"
          placeholder="e.g. Water plants"
          bind:value={title}
        />

        <label class="label" for="plan-schedule-type">
          <span class="label-text">Schedule type</span>
        </label>
        <select id="plan-schedule-type" class="select select-sm" bind:value={planType}>
          <option value="INTERVAL_FIXED">Fixed interval (e.g. every 2 weeks)</option>
          <option value="INTERVAL_AFTER_DONE">After completion (e.g. 3 days after done)</option>
          <option value="FIXED_DAYS">Specific days</option>
        </select>

        {#if planType.startsWith('INTERVAL')}
          <span class="label-text">Interval</span>
          <div class="grid grid-cols-2 gap-2 flex-wrap">
            {#each intervalFields as field (field.key)}
              <label class="input input-sm flex items-center gap-1">
                <span class="text-xs">{field.label}</span>
                <input type="number" min="0" class="" bind:value={planInterval[field.key]} />
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

          {#if planDaysSubtype === 'WEEKDAYS'}
            <div class="flex flex-wrap gap-1 mt-1">
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
              class="input input-sm mt-1"
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
              class="input input-sm mt-1"
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

        <label class="label" for="plan-start-date">
          <span class="label-text">Start date</span>
        </label>
        <input id="plan-start-date" type="date" class="input input-sm" bind:value={planStartDate} />

        <div class="flex justify-end mt-2">
          <button class="btn btn-primary btn-sm" disabled={!canSave()} onclick={handleSave}>
            <Save class="size-4" />
            Save
          </button>
        </div>
      </div>
    </div>

    {#if ctrl.plan.recurrence}
      <div class="mt-4 text-xs text-base-content/40">
        Current schedule: {describeRecurrence(ctrl.plan.recurrence)}
      </div>
    {/if}
  {/if}
</div>

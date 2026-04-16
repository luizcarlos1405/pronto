<script lang="ts">
	import { getCareDetailState, describeRecurrence } from '../cares-page-state.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-svelte';
	import type { Recurrence } from '$lib/types';

	const careId = page.params.id!;
	const ctrl = getCareDetailState(careId);

	onMount(() => ctrl.load());

	async function handleDeletePlan(planId: string) {
		if (confirm('Remove this task plan?')) {
			await ctrl.removeTaskPlan(planId);
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
	<a href={resolve('/cares')} class="btn btn-ghost btn-sm mb-2">
		<ArrowLeft class="size-4" />
		Back
	</a>

	{#if ctrl.loading}
		<div class="flex justify-center py-8">
			<Loader2 class="size-6 animate-spin text-base-content/40" />
		</div>
	{:else if ctrl.care}
		<h1 class="text-2xl font-bold mb-4">{ctrl.care.title}</h1>

		{#if ctrl.care.taskPlans.length > 0}
			<h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">Task Plans</h2>
			<ul class="list mb-6">
				{#each ctrl.care.taskPlans as plan (plan._id)}
					<li class="list-row">
						<div class="list-col-grow">
							<div class="font-medium">{plan.title}</div>
							<div class="text-xs text-base-content/50">{describeRecurrence(plan.recurrence)}</div>
							{#if plan.lastDoAtDate}
								<div class="text-xs text-base-content/40">Last generated: {plan.lastDoAtDate}</div>
							{/if}
						</div>
						<button
							class="btn btn-ghost btn-sm text-error"
							onclick={() => handleDeletePlan(plan._id)}
						>
							<Trash2 class="size-4" />
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-base-content/50 text-center py-4 mb-4">No task plans yet.</p>
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
				Add Task Plan
			</button>
		{:else}
			<div class="card card-border bg-base-200 mt-4">
				<div class="card-body p-4 gap-3">
					<h3 class="font-semibold">New Task Plan</h3>

					{#if planStep >= 0}
						<label class="label">
							<span class="label-text">Task title</span>
						</label>
						<input
							type="text"
							class="input input-sm"
							placeholder="e.g. Water plants"
							bind:value={newPlanTitle}
						/>
					{/if}

					{#if planStep >= 1}
						<label class="label">
							<span class="label-text">Schedule type</span>
						</label>
						<select class="select select-sm" bind:value={planType}>
							<option value="INTERVAL_FIXED">Fixed interval (e.g. every 2 weeks)</option>
							<option value="INTERVAL_AFTER_DONE">After completion (e.g. 3 days after done)</option>
							<option value="FIXED_DAYS">Specific days</option>
						</select>
					{/if}

					{#if planStep >= 2}
						{#if planType.startsWith('INTERVAL')}
							<label class="label">
								<span class="label-text">Interval</span>
							</label>
							<div class="flex gap-2 flex-wrap">
								{#each [{ key: 'years' as const, label: 'Years' }, { key: 'months' as const, label: 'Months' }, { key: 'weeks' as const, label: 'Weeks' }, { key: 'days' as const, label: 'Days' }] as field}
									<label class="input input-sm flex items-center gap-1">
										<span class="text-xs">{field.label}</span>
										<input
											type="number"
											min="0"
											class="w-12"
											bind:value={planInterval[field.key]}
										/>
									</label>
								{/each}
							</div>
						{:else}
							<label class="label">
								<span class="label-text">Day type</span>
							</label>
							<select class="select select-sm" bind:value={planDaysSubtype}>
								<option value="WEEKDAYS">Days of the week</option>
								<option value="MONTHDAYS">Days of the month</option>
								<option value="YEARDAYS">Specific dates</option>
							</select>
						{/if}
					{/if}

					{#if planStep >= 3 && planType === 'FIXED_DAYS'}
						{#if planDaysSubtype === 'WEEKDAYS'}
							<div class="flex flex-wrap gap-1">
								{#each dayNames as name, i}
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
						<label class="label">
							<span class="label-text">Start date</span>
						</label>
						<input type="date" class="input input-sm" bind:value={planStartDate} />
					{/if}

					<div class="flex gap-2 mt-2">
						{#if planStep > 0}
							<button class="btn btn-ghost btn-sm" onclick={() => planStep--}>Back</button>
						{/if}
						{#if planStep < 4}
							<button class="btn btn-sm" onclick={() => planStep++}>Next</button>
						{/if}
						{#if planStep === 4}
							<button class="btn btn-primary btn-sm" disabled={!canCreate()} onclick={handleCreate}>
								Create
							</button>
						{/if}
						<div class="flex-1"></div>
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => {
								ctrl.showWizard = false;
								resetWizard();
							}}>Cancel</button
						>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<script lang="ts">
	import { getInboxProcessorState, type CreatedEntity } from './inbox-processor-state.svelte';
	import type { InboxItemDoc, Recurrence } from '$lib/types';
	import { CheckSquare, Target, Heart, Plus, Loader2 } from 'lucide-svelte';

	let { inboxItem, onDone }: { inboxItem: InboxItemDoc; onDone: () => void } = $props();

	const state = getInboxProcessorState(inboxItem);

	let carePlanTitle: string = $state('');
	let carePlanInterval: { years: number; months: number; weeks: number; days: number } = $state({ years: 0, months: 0, weeks: 0, days: 0 });
	let showCarePlan = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (state.mode === 'task') state.createTask();
			else if (state.mode === 'objective') state.createObjective();
		}
	}

	async function handleFinish() {
		await state.finish();
		onDone();
	}

	async function handleAddCarePlan() {
		const interval = carePlanInterval;
		const total = interval.years + interval.months + interval.weeks + interval.days;
		if (!carePlanTitle.trim() || total <= 0) return;
		const recurrence: Recurrence = {
			type: 'INTERVAL',
			subtype: 'FIXED',
			interval,
			startDate: new Date().toISOString().slice(0, 10)
		};
		await state.createCare([{ title: carePlanTitle.trim(), recurrence }]);
		carePlanTitle = '';
		carePlanInterval = { years: 0, months: 0, weeks: 0, days: 0 };
		showCarePlan = false;
	}

	const entityIcon: Record<string, typeof CheckSquare> = {
		task: CheckSquare,
		objective: Target,
		care: Heart
	};
	const entityLabel: Record<string, string> = {
		task: 'Task',
		objective: 'Objective',
		care: 'Care'
	};
</script>

<dialog class="modal modal-open">
	<div class="modal-box max-w-lg">
		<h3 class="font-bold text-lg mb-1">Process Inbox Item</h3>
		<p class="text-base-content/60 mb-4">{inboxItem.title}</p>

		{#if state.created.length > 0}
			<div class="mb-4">
				<p class="text-sm font-semibold text-base-content/60 uppercase mb-1">Created</p>
				{#each state.created as entity (entity.title + entity.type)}
					<div class="badge badge-sm badge-success gap-1 mr-1">
						{entityLabel[entity.type]}: {entity.title}
					</div>
				{/each}
			</div>
		{/if}

		{#if state.mode === 'choose'}
			<div class="flex flex-col gap-2">
				<button class="btn btn-outline btn-sm" onclick={() => state.mode = 'task'}>
					<CheckSquare class="size-4" /> Create Task
				</button>
				<button class="btn btn-outline btn-sm" onclick={() => state.mode = 'objective'}>
					<Target class="size-4" /> Create Objective
				</button>
				<button class="btn btn-outline btn-sm" onclick={() => state.mode = 'care'}>
					<Heart class="size-4" /> Create Care
				</button>
			</div>
		{:else if state.mode === 'task'}
			<div class="flex flex-col gap-2">
				<input type="text" class="input input-sm" placeholder="Task title" bind:value={state.taskTitle} onkeydown={handleKeydown} />
				<input type="date" class="input input-sm" bind:value={state.taskDoAt} />
				<div class="flex gap-2">
					<button class="btn btn-primary btn-sm" onclick={state.createTask} disabled={state.processing || !state.taskTitle.trim()}>
						{#if state.processing}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
						Create Task
					</button>
					<button class="btn btn-ghost btn-sm" onclick={state.resetMode}>Back</button>
				</div>
			</div>
		{:else if state.mode === 'objective'}
			<div class="flex flex-col gap-2">
				<input type="text" class="input input-sm" placeholder="Objective title" bind:value={state.objectiveTitle} onkeydown={handleKeydown} />
				<div class="flex gap-2">
					<button class="btn btn-primary btn-sm" onclick={state.createObjective} disabled={state.processing || !state.objectiveTitle.trim()}>
						{#if state.processing}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
						Create Objective
					</button>
					<button class="btn btn-ghost btn-sm" onclick={state.resetMode}>Back</button>
				</div>
			</div>
		{:else if state.mode === 'care'}
			<div class="flex flex-col gap-2">
				<input type="text" class="input input-sm" placeholder="Care title" bind:value={state.careTitle} />

				{#if state.created.some((e) => e.type === 'care')}
					<p class="text-xs text-success">Care created. You can add task plans later from the Cares page.</p>
				{:else}
					{#if !showCarePlan}
						<button class="btn btn-ghost btn-sm" onclick={() => showCarePlan = true}>
							<Plus class="size-4" /> Add a task plan
						</button>
					{:else}
						<div class="bg-base-200 rounded-lg p-3 flex flex-col gap-2">
							<input type="text" class="input input-sm" placeholder="Plan title" bind:value={carePlanTitle} />
							<div class="flex gap-1 flex-wrap">
								{#each [
									{ key: 'years' as const, label: 'Y' },
									{ key: 'months' as const, label: 'M' },
									{ key: 'weeks' as const, label: 'W' },
									{ key: 'days' as const, label: 'D' }
								] as field}
									<label class="input input-sm flex items-center gap-1">
										<span class="text-xs">{field.label}</span>
										<input type="number" min="0" class="w-10" bind:value={carePlanInterval[field.key]} />
									</label>
								{/each}
							</div>
							<button class="btn btn-sm" onclick={handleAddCarePlan}>Add Plan</button>
						</div>
					{/if}
				{/if}

				<div class="flex gap-2">
					<button class="btn btn-primary btn-sm" onclick={() => state.createCare([])} disabled={state.processing || !state.careTitle.trim()}>
						{#if state.processing}<Loader2 class="size-4 animate-spin" />{:else}<Plus class="size-4" />{/if}
						Create Care
					</button>
					<button class="btn btn-ghost btn-sm" onclick={state.resetMode}>Back</button>
				</div>
			</div>
		{/if}

		<div class="modal-action">
			<button class="btn btn-success btn-sm" onclick={handleFinish} disabled={state.processing}>
				Done
			</button>
			<button class="btn btn-ghost btn-sm" onclick={onDone}>Cancel</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop"><button onclick={onDone}>close</button></form>
</dialog>

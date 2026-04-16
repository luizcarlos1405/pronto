<script lang="ts">
	import { getObjectiveDetailState } from '../objectives-page-state.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { ArrowLeft, CheckSquare, Square, Plus, Loader2 } from 'lucide-svelte';

	const objectiveId = page.params.id;
	const state = getObjectiveDetailState(objectiveId);

	onMount(() => state.load());

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') state.addTask();
	}

	const statusBadge: Record<string, string> = {
		NOT_STARTED: 'badge-neutral',
		IN_PROGRESS: 'badge-info',
		REVIEW: 'badge-warning',
		COMPLETED: 'badge-success'
	};

	const statusLabel: Record<string, string> = {
		NOT_STARTED: 'Not started',
		IN_PROGRESS: 'In progress',
		REVIEW: 'Review',
		COMPLETED: 'Completed'
	};
</script>

<div class="p-4">
	<a href="/objectives" class="btn btn-ghost btn-sm mb-2">
		<ArrowLeft class="size-4" />
		Back
	</a>

	{#if state.loading}
		<div class="flex justify-center py-8">
			<Loader2 class="size-6 animate-spin text-base-content/40" />
		</div>
	{:else if state.objective}
		<div class="flex items-center gap-3 mb-4">
			<h1 class="text-2xl font-bold flex-1">{state.objective.title}</h1>
			<span class="badge {statusBadge[state.objective.status]}">{statusLabel[state.objective.status]}</span>
		</div>

		{#if state.objective.status === 'REVIEW'}
			<button class="btn btn-success btn-sm mb-4" onclick={state.markCompleted}>
				Mark Completed
			</button>
		{/if}

		<div class="join w-full mb-6">
			<input
				type="text"
				class="input join-item flex-1"
				placeholder="Add a task..."
				bind:value={state.newTaskTitle}
				onkeydown={handleKeydown}
			/>
			<button class="btn btn-primary join-item" onclick={state.addTask}>
				<Plus class="size-4" />
			</button>
		</div>

		{#if state.tasks.length === 0}
			<p class="text-base-content/50 text-center py-4">No tasks yet.</p>
		{:else}
			<ul class="list">
				{#each state.tasks as task (task._id)}
					<li class="list-row">
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => state.toggleTask(task._id)}
						>
							{#if task.status === 'DONE'}
								<CheckSquare class="size-5 text-success" />
							{:else}
								<Square class="size-5" />
							{/if}
						</button>
						<div class="list-col-grow">
							<div class={task.status === 'DONE' ? 'line-through opacity-60' : ''}>{task.title}</div>
							<div class="text-xs text-base-content/50">{task.doAt}</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

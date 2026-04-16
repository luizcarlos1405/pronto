<script lang="ts">
	import { getGoalsPageState } from './goals-page-state.svelte';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Target, Plus, Loader2 } from 'lucide-svelte';

	const state = getGoalsPageState();

	onMount(() => state.load());

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') state.add();
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
		COMPLETED: 'Done'
	};
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Goals</h1>

	<div class="join w-full mb-6">
		<input
			type="text"
			class="input join-item flex-1"
			placeholder="Add a goal..."
			bind:value={state.newTitle}
			onkeydown={handleKeydown}
		/>
		<button class="btn btn-primary join-item" onclick={state.add}>
			<Plus class="size-4" />
			Add
		</button>
	</div>

	{#if state.loading}
		<div class="flex justify-center py-8">
			<Loader2 class="size-6 animate-spin text-base-content/40" />
		</div>
	{:else if state.goals.length === 0}
		<div class="text-center py-12 text-base-content/50">
			<Target class="size-12 mx-auto mb-3 opacity-40" />
			<p>No goals yet. Add one above.</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each state.goals as goal (goal._id)}
				<a
					href={resolve(`/goals/${goal._id}`)}
					class="card card-border hover:bg-base-200 transition-colors"
				>
					<div class="card-body flex-row items-center gap-3 p-4">
						<div class="flex-1">
							<div class="font-semibold">{goal.title}</div>
							<span class="badge badge-sm {statusBadge[goal.status]}"
								>{statusLabel[goal.status]}</span
							>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

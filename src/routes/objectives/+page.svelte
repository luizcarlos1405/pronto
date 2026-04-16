<script lang="ts">
	import { getObjectivesPageState } from './objectives-page-state.svelte';
	import { onMount } from 'svelte';
	import { Target, Plus, Loader2 } from 'lucide-svelte';

	const state = getObjectivesPageState();

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
		COMPLETED: 'Completed'
	};
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Objectives</h1>

	<div class="join w-full mb-6">
		<input
			type="text"
			class="input join-item flex-1"
			placeholder="Add an objective..."
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
	{:else if state.objectives.length === 0}
		<div class="text-center py-12 text-base-content/50">
			<Target class="size-12 mx-auto mb-3 opacity-40" />
			<p>No objectives yet. Create one above.</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each state.objectives as obj (obj._id)}
				<a href="/objectives/{obj._id}" class="card card-border hover:bg-base-200 transition-colors">
					<div class="card-body flex-row items-center gap-3 p-4">
						<div class="flex-1">
							<div class="font-semibold">{obj.title}</div>
							<span class="badge badge-sm {statusBadge[obj.status]}">{statusLabel[obj.status]}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

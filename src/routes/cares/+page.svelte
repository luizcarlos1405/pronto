<script lang="ts">
	import { getCaresPageState } from './cares-page-state.svelte';
	import { onMount } from 'svelte';
	import { Heart, Plus, Loader2 } from 'lucide-svelte';

	const state = getCaresPageState();

	onMount(() => state.load());

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') state.add();
	}
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Cares</h1>

	<div class="join w-full mb-6">
		<input
			type="text"
			class="input join-item flex-1"
			placeholder="Add a care..."
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
	{:else if state.cares.length === 0}
		<div class="text-center py-12 text-base-content/50">
			<Heart class="size-12 mx-auto mb-3 opacity-40" />
			<p>No cares yet. Create one to set up recurring tasks.</p>
		</div>
	{:else}
		<div class="grid gap-3">
			{#each state.cares as care (care._id)}
				<a href="/cares/{care._id}" class="card card-border hover:bg-base-200 transition-colors">
					<div class="card-body flex-row items-center gap-3 p-4">
						<div class="flex-1">
							<div class="font-semibold">{care.title}</div>
							<div class="text-xs text-base-content/50">
								{care.taskPlans.length} task plan{care.taskPlans.length !== 1 ? 's' : ''}
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

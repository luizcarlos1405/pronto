<script lang="ts">
	import { getTasksPageState } from './tasks-page-state.svelte';
	import { onMount } from 'svelte';
	import { CheckSquare, Square, Plus, Loader2 } from 'lucide-svelte';

	const state = getTasksPageState();

	onMount(() => state.load());

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') state.add();
	}
</script>

<div class="p-4">
	<h1 class="text-2xl font-bold mb-4">Tasks</h1>

	<div class="join w-full mb-6">
		<input
			type="text"
			class="input join-item flex-1"
			placeholder="Add a task..."
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
	{:else if state.tasks.length === 0 && state.doneToday.length === 0}
		<div class="text-center py-12 text-base-content/50">
			<CheckSquare class="size-12 mx-auto mb-3 opacity-40" />
			<p>All clear! Nothing to do right now.</p>
		</div>
	{:else}
		{#if state.tasks.length > 0}
			<h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">To Do</h2>
			<ul class="list mb-6">
				{#each state.tasks as task (task._id)}
					<li class="list-row">
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => state.toggleComplete(task._id)}
						>
							<Square class="size-5" />
						</button>
						<div class="list-col-grow">
							<div>{task.title}</div>
							<div class="text-xs text-base-content/50">{task.doAt}</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		{#if state.doneToday.length > 0}
			<h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">Done Today</h2>
			<ul class="list">
				{#each state.doneToday as task (task._id)}
					<li class="list-row opacity-60">
						<button
							class="btn btn-ghost btn-sm"
							onclick={() => state.toggleComplete(task._id)}
						>
							<CheckSquare class="size-5 text-success" />
						</button>
						<div class="list-col-grow">
							<div class="line-through">{task.title}</div>
							<div class="text-xs text-base-content/50">{task.doAt}</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

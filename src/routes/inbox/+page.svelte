<script lang="ts">
  import { getInboxPageState } from './inbox-page-state.svelte';
  import InboxProcessor from '$lib/components/inbox-processor.svelte';
  import { onMount } from 'svelte';
  import { Inbox, Loader2, ArrowRight } from 'lucide-svelte';

  const state = getInboxPageState();

  onMount(() => state.load());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') state.add();
  }

  async function handleProcessingDone() {
    state.stopProcessing();
    await state.load();
  }
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Inbox</h1>

  <div class="join w-full mb-6">
    <input
      type="text"
      class="input join-item flex-1"
      placeholder="Capture a thought..."
      bind:value={state.newTitle}
      onkeydown={handleKeydown}
    />
    <button class="btn btn-primary join-item" onclick={state.add}>
      <Inbox class="size-4" />
      Add
    </button>
  </div>

  {#if state.loading}
    <div class="flex justify-center py-8">
      <Loader2 class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if state.items.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <Inbox class="size-12 mx-auto mb-3 opacity-40" />
      <p>Your inbox is empty. Nice.</p>
    </div>
  {:else}
    <ul class="list">
      {#each state.items as item (item._id)}
        <li class="list-row">
          <div class="list-col-grow">
            <div>{item.title}</div>
            <div class="text-xs text-base-content/50">
              {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
          <button
            class="btn btn-ghost btn-sm btn-primary"
            onclick={() => state.startProcessing(item._id)}
          >
            <ArrowRight class="size-4" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#each state.items as item (item._id)}
  {#if item._id === state.processingItemId}
    <InboxProcessor
      open={!!state.processingItemId}
      inboxItem={item}
      onDone={handleProcessingDone}
    />
  {/if}
{/each}

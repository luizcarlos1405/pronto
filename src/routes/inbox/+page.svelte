<script lang="ts">
  import { getInboxPageState } from './inbox-page-state.svelte';
  import InboxProcessor from '$lib/components/inbox-processor.svelte';
  import { onMount } from 'svelte';
  import Inbox from 'lucide-svelte/icons/inbox';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import ArrowRight from 'lucide-svelte/icons/arrow-right';
  import { Temporal } from '@js-temporal/polyfill';
  import { tick } from 'svelte';

  const ctrl = getInboxPageState();
  let itemList: HTMLUListElement | undefined = $state();

  onMount(() => ctrl.load());

  async function addAndScroll() {
    await ctrl.add();
    await tick();
    const last = itemList?.lastElementChild;
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') addAndScroll();
  }

  async function handleProcessingDone() {
    ctrl.stopProcessing();
    await ctrl.load();
  }
</script>

<div class="p-4 relative">
  <h1 class="text-2xl font-bold mb-4">Inbox</h1>

  <div class="join w-full mb-6 sticky top-4 z-50">
    <input
      type="text"
      class="input join-item flex-1"
      placeholder="Capture a thought..."
      bind:value={ctrl.newTitle}
      onkeydown={handleKeydown}
    />
    <button class="btn btn-primary join-item" onclick={addAndScroll}>
      <Inbox class="size-4" />
      Add
    </button>
  </div>

  {#if ctrl.loading}
    <div class="flex justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if ctrl.items.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <Inbox class="size-12 mx-auto mb-3 opacity-40" />
      <p>Your inbox is empty. Nice.</p>
    </div>
  {:else}
    <ul class="list" bind:this={itemList}>
      {#each ctrl.items as item (item._id)}
        <li class="list-row">
          <div class="list-col-grow">
            <div>{item.title}</div>
            <div class="text-xs text-base-content/50">
              {Temporal.Instant.from(item.createdAt).toLocaleString()}
            </div>
          </div>
          <button
            class="btn btn-ghost btn-sm btn-primary"
            onclick={() => ctrl.startProcessing(item._id)}
          >
            <ArrowRight class="size-4" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

{#each ctrl.items as item (item._id)}
  <InboxProcessor
    open={ctrl.processingItemId === item._id}
    inboxItem={item}
    onDone={handleProcessingDone}
  />
{/each}

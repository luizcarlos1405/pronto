<script lang="ts">
  import { getCaresPageState } from './cares-page-state.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import Heart from 'lucide-svelte/icons/heart';
  import Plus from 'lucide-svelte/icons/plus';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import { orderableChildren } from '$lib/attachments/orderableChildren';
  import { flip } from 'svelte/animate';
  import { tick } from 'svelte';

  const ctrl = getCaresPageState();

  let isDragging = $state(false);
  let careList: HTMLUListElement | undefined = $state();

  onMount(() => ctrl.load());

  async function addAndScroll() {
    await ctrl.add();
    await tick();
    const last = careList?.lastElementChild;
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') addAndScroll();
  }
</script>

<div class="p-4 relative">
  <h1 class="text-2xl font-bold mb-4">Cares</h1>

  <div class="join w-full mb-6 sticky top-4 z-50">
    <input
      type="text"
      class="input join-item flex-1"
      placeholder="Add a care..."
      bind:value={ctrl.newTitle}
      onkeydown={handleKeydown}
    />
    <button class="btn btn-primary join-item" onclick={addAndScroll}>
      <Plus class="size-4" />
      Add
    </button>
  </div>

  {#if ctrl.loading}
    <div class="flex justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if ctrl.cares.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <Heart class="size-12 mx-auto mb-3 opacity-40" />
      <p>No cares yet. Add one to set up recurring tasks.</p>
    </div>
  {:else}
    <ul
      class="list"
      bind:this={careList}
      {@attach orderableChildren({
        startEvents: ['mousedown', 'touchstart'],
        handleSelector: '.drag-handle',
        onStart: () => {
          isDragging = true;
        },
        onEnd: () => {
          isDragging = false;
          ctrl.persistOrder();
        },
        onMove: ({ fromIndex, toIndex }) => {
          ctrl.reorder(fromIndex, toIndex);
        },
      })}
    >
      {#each ctrl.cares as care (care._id)}
        <li class="list-row bg-base-100 w-full" animate:flip={{ duration: 200 }}>
          <a href={resolve(`/cares/${care._id}`)} class="list-col-grow">
            <div class="font-semibold">{care.title}</div>
            <div class="text-xs text-base-content/50">
              {care.taskPlans.length} task plan{care.taskPlans.length !== 1 ? 's' : ''}
            </div>
          </a>
          <div
            class:cursor-grab={!isDragging}
            class:cursor-grabbing={isDragging}
            class="drag-handle flex pr-2 ml-auto items-center"
          >
            <GripVertical class="size-6 text-base-content/30" />
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<script lang="ts">
  import { getGoalsPageState } from './goals-page-state.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import Target from 'lucide-svelte/icons/target';
  import Plus from 'lucide-svelte/icons/plus';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import { orderableChildren } from '$lib/attachments/orderableChildren';
  import { flip } from 'svelte/animate';

  const ctrl = getGoalsPageState();

  let isDragging = $state(false);

  onMount(() => ctrl.load());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') ctrl.add();
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
      bind:value={ctrl.newTitle}
      onkeydown={handleKeydown}
    />
    <button class="btn btn-primary join-item" onclick={ctrl.add}>
      <Plus class="size-4" />
      Add
    </button>
  </div>

  {#if ctrl.loading}
    <div class="flex justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if ctrl.goals.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <Target class="size-12 mx-auto mb-3 opacity-40" />
      <p>No goals yet. Add one above.</p>
    </div>
  {:else}
    <ul
      class="list"
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
        }
      })}
    >
      {#each ctrl.goals as goal (goal._id)}
        <li class="list-row bg-base-100 w-full" animate:flip={{ duration: 200 }}>
          <a href={resolve(`/goals/${goal._id}`)} class="list-col-grow p-2 -m-2">
            <div class="font-semibold">{goal.title}</div>
            <span class="badge badge-sm {statusBadge[goal.status]}">{statusLabel[goal.status]}</span
            >
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

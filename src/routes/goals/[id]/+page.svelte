<script lang="ts">
  import { getGoalDetailState } from '../goals-page-state.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import SquareCheckBig from 'lucide-svelte/icons/square-check-big';
  import Square from 'lucide-svelte/icons/square';
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import { goto } from '$app/navigation';
  import { getConfirmState } from '$lib/components/confirm-state.svelte';
  import { orderableChildren } from '$lib/actions/orderableChildren';
  import { flip } from 'svelte/animate';

  const goalId = page.params.id!;
  const ctrl = getGoalDetailState(goalId);

  let isDragging = $state(false);

  onMount(() => ctrl.load());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') ctrl.addTask();
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

  async function handleDelete() {
    if (await getConfirmState().confirm({ message: 'Remove this goal and all its tasks?' })) {
      await ctrl.deleteGoal();
      goto(resolve('/goals'));
    }
  }
</script>

<div class="p-4">
  <div class="flex justify-between mb-2">
    <a href={resolve('/goals')} class="btn btn-ghost btn-sm">
      <ArrowLeft class="size-4" />
      Back
    </a>
    {#if ctrl.goal}
      <button class="btn btn-ghost btn-sm text-error" onclick={handleDelete}>
        <Trash2 class="size-4" />
        Delete
      </button>
    {/if}
  </div>

  {#if ctrl.loading}
    <div class="flex justify-center py-8">
      <LoaderCircle class="size-6 animate-spin text-base-content/40" />
    </div>
  {:else if ctrl.goal}
    <div class="flex items-center gap-3 mb-4">
      <h1 class="text-2xl font-bold flex-1">{ctrl.goal.title}</h1>
      <span class="badge {statusBadge[ctrl.goal.status]}">{statusLabel[ctrl.goal.status]}</span>
    </div>

    {#if ctrl.goal.status === 'REVIEW'}
      <button class="btn btn-success btn-sm mb-4" onclick={ctrl.markCompleted}> Mark done </button>
    {/if}

    <div class="join w-full mb-6">
      <input
        type="text"
        class="input join-item flex-1"
        placeholder="Add a task..."
        bind:value={ctrl.newTaskTitle}
        onkeydown={handleKeydown}
      />
      <button class="btn btn-primary join-item" onclick={ctrl.addTask}>
        <Plus class="size-4" />
      </button>
    </div>

    {#if ctrl.tasks.length === 0}
      <p class="text-base-content/50 text-center py-4">No tasks yet. Add your first one.</p>
    {:else}
      <ul
        class="list"
        use:orderableChildren={{
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
        }}
      >
        {#each ctrl.tasks as task (task._id)}
          <li class="list-row bg-base-100" animate:flip={{ duration: 200 }}>
            <button class="btn btn-ghost btn-sm" onclick={() => ctrl.toggleTask(task._id)}>
              {#if task.status === 'DONE'}
                <SquareCheckBig class="size-5 text-success" />
              {:else}
                <Square class="size-5" />
              {/if}
            </button>
            <div class="list-col-grow">
              <div class={task.status === 'DONE' ? 'line-through opacity-60' : ''}>
                {task.title}
              </div>
              <div class="text-xs text-base-content/50">{task.doAt}</div>
            </div>
            <div
              class:cursor-grab={!isDragging}
              class:cursor-grabbing={isDragging}
              class="drag-handle flex pr-2 items-center"
            >
              <GripVertical class="size-6 text-base-content/30" />
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

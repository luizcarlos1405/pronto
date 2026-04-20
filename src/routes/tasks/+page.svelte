<script lang="ts">
  import { getTasksPageState } from './tasks-page-state.svelte';
  import SquareCheckBig from 'lucide-svelte/icons/square-check-big';
  import Square from 'lucide-svelte/icons/square';
  import Plus from 'lucide-svelte/icons/plus';
  import LoaderCircle from 'lucide-svelte/icons/loader-circle';
  import CalendarClock from 'lucide-svelte/icons/calendar-clock';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import SwipeableItem from '$lib/components/swipeable-item.svelte';
  import TaskEditModal from '$lib/components/task-edit-modal.svelte';
  import { orderableChildren } from '$lib/attachments/orderableChildren';
  import { formatFriendlyDate } from '$lib/utils/format-date';
  import { flip } from 'svelte/animate';
  import { resolve } from '$app/paths';

  const ctrl = getTasksPageState();
  let isDragging = $state(false);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') ctrl.add();
  }
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Tasks</h1>

  <div class="join w-full mb-6">
    <input
      type="text"
      class="input join-item flex-1"
      placeholder="Add a task..."
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
  {:else if ctrl.tasks.length === 0 && ctrl.doneToday.length === 0}
    <div class="text-center py-12 text-base-content/50">
      <SquareCheckBig class="size-12 mx-auto mb-3 opacity-40" />
      <p>No tasks for today. Enjoy the quiet — or add something new.</p>
    </div>
  {:else}
    {#if ctrl.tasks.length > 0}
      <h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">To Do</h2>
      <ul
        class="list mb-6"
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
        {#each ctrl.tasks as task (task._id)}
          {@const origin = ctrl.getOriginInfo(task)}
          <li class="list-row bg-base-100 w-full" animate:flip={{ duration: 200 }}>
            <SwipeableItem
              class="list-col-grow"
              onswipe={(direction) => {
                if (direction === 'right') ctrl.postponeTask(task._id);
                else ctrl.removeTask(task._id);
              }}
            >
              {#snippet leftBackground()}
                <div class="bg-info text-base-100 w-full h-full flex items-center justify-center">
                  <CalendarClock class="size-5" />
                </div>
              {/snippet}
              {#snippet rightBackground()}
                <div class="bg-error text-base-100 w-full h-full flex items-center justify-center">
                  <Trash2 class="size-5" />
                </div>
              {/snippet}
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-sm" onclick={() => ctrl.toggleComplete(task._id)}>
                  <Square class="size-5" />
                </button>
                <div
                  class="flex-1 min-w-0 cursor-pointer"
                  onclick={() => ctrl.openEdit(task._id)}
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') ctrl.openEdit(task._id);
                  }}
                >
                  <div>{task.title}</div>
                  <div class="text-xs text-base-content/50 truncate">
                    {formatFriendlyDate(task.doAt)}
                    {#if origin}
                      &ensp;&middot;&ensp;<a
                        href={resolve(
                          origin.type === 'goal' ? `/goals/${origin.id}` : `/cares/${origin.id}`,
                        )}
                        class="hover:underline"
                        onclick={(e) => e.stopPropagation()}>{origin.title}</a
                      >
                    {/if}
                  </div>
                </div>
              </div>
            </SwipeableItem>
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

    {#if ctrl.doneToday.length > 0}
      <h2 class="text-sm font-semibold text-base-content/60 uppercase mb-2">Done Today</h2>
      <ul class="list">
        {#each ctrl.doneToday as task (task._id)}
          {@const origin = ctrl.getOriginInfo(task)}
          <li class="list-row opacity-60">
            <button class="btn btn-ghost btn-sm" onclick={() => ctrl.toggleComplete(task._id)}>
              <SquareCheckBig class="size-5 text-success" />
            </button>
            <div
              class="list-col-grow cursor-pointer"
              onclick={() => ctrl.openEdit(task._id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => {
                if (e.key === 'Enter') ctrl.openEdit(task._id);
              }}
            >
              <div class="line-through">{task.title}</div>
              <div class="text-xs text-base-content/50 truncate">
                {formatFriendlyDate(task.doAt)}
                {#if origin}
                  &ensp;&middot;&ensp;<a
                    href={resolve(
                      origin.type === 'goal' ? `/goals/${origin.id}` : `/cares/${origin.id}`,
                    )}
                    class="hover:underline"
                    onclick={(e) => e.stopPropagation()}>{origin.title}</a
                  >
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<TaskEditModal
  open={!!ctrl.editingTask}
  task={ctrl.editingTask}
  onclose={ctrl.closeEdit}
  onsave={ctrl.saveEdit}
  ontransformgoal={ctrl.transformToGoal}
  ontransformcare={ctrl.transformToCare}
/>

<script lang="ts">
  import type { TaskDoc } from '$lib/types';
  import { Temporal } from '@js-temporal/polyfill';
  import Target from 'lucide-svelte/icons/target';
  import Heart from 'lucide-svelte/icons/heart';
  import ChevronDown from 'lucide-svelte/icons/chevron-down';
  import { slide } from 'svelte/transition';

  let {
    open,
    task,
    onclose,
    onsave,
    ontransformgoal,
    ontransformcare,
  }: {
    open: boolean;
    task?: TaskDoc | null;
    onclose: () => void;
    onsave: (title: string, doAt: string) => void;
    ontransformgoal: () => void;
    ontransformcare: () => void;
  } = $props();

  let editTitle = $state('');
  let editDate = $state('');
  let showConvert = $state(false);
  let tomorrowOffset = $state(0);

  $effect(() => {
    if (task) {
      editTitle = task.title;
      editDate = task.doAt;
      tomorrowOffset = 0;
    }
  });

  function handleSave() {
    if (!editTitle.trim()) return;
    onsave(editTitle, editDate);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  function setTomorrow() {
    tomorrowOffset += 1;
    editDate = Temporal.Now.plainDateISO().add({ days: tomorrowOffset }).toString();
  }
</script>

<dialog class="modal modal-bottom" class:modal-open={open}>
  <div class="modal-box">
    <h3 class="font-bold text-lg mb-4">Edit task</h3>

    <div class="flex flex-col gap-3">
      <input
        type="text"
        class="input input-bordered w-full"
        placeholder="Task title"
        bind:value={editTitle}
        onkeydown={handleKeydown}
      />
      <div class="join w-full">
        <input
          type="date"
          class="input input-bordered join-item flex-1"
          bind:value={editDate}
          oninput={() => (tomorrowOffset = 0)}
        />
        <div class="indicator">
          {#if tomorrowOffset > 1}
            <span class="indicator-item indicator-start badge badge-accent"
              >+{tomorrowOffset} days</span
            >
          {/if}
          <button class="btn join-item" class:btn-secondary={!!tomorrowOffset} onclick={setTomorrow}
            >Tomorrow</button
          >
        </div>
      </div>

      <button class="btn btn-ghost btn-sm w-full" onclick={() => (showConvert = !showConvert)}>
        <span class="transition-transform duration-200" class:rotate-180={showConvert}>
          <ChevronDown class="size-4" />
        </span> Convert
      </button>

      {#if showConvert}
        <div class="flex gap-2" transition:slide={{ duration: 200 }}>
          <button
            class="btn btn-outline btn-sm flex-1"
            onclick={ontransformgoal}
            disabled={!editTitle.trim()}
          >
            <Target class="size-4" />
            Convert to goal
          </button>
          <button
            class="btn btn-outline btn-sm flex-1"
            onclick={ontransformcare}
            disabled={!editTitle.trim()}
          >
            <Heart class="size-4" />
            Convert to care
          </button>
        </div>
      {/if}
    </div>

    <div class="modal-action">
      <button class="btn btn-ghost btn-sm" onclick={onclose}>Cancel</button>
      <button class="btn btn-primary btn-sm" onclick={handleSave} disabled={!editTitle.trim()}>
        Save
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button onclick={onclose}>close</button>
  </form>
</dialog>

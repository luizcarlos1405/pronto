<script lang="ts">
  import { getConfirmState } from './confirm-state.svelte';
  import { AlertTriangle } from 'lucide-svelte';

  const ctrl = getConfirmState();

  function handleCancel() {
    ctrl.respond(false);
  }

  function handleConfirm() {
    ctrl.respond(true);
  }
</script>

{#if ctrl.pending}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-sm">
      {#if ctrl.pending.options.destructive !== false}
        <div class="flex items-center gap-2 text-error mb-3">
          <AlertTriangle class="size-5 shrink-0" />
          <span class="font-semibold">Are you sure?</span>
        </div>
      {/if}
      <p class="text-sm opacity-70 mb-5">{ctrl.pending.options.message}</p>
      <div class="flex gap-2 justify-end">
        <button class="btn btn-sm btn-ghost" onclick={handleCancel}>
          {ctrl.pending.options.cancelLabel ?? 'Cancel'}
        </button>
        <button
          class="btn btn-sm {ctrl.pending.options.destructive !== false
            ? 'btn-error'
            : 'btn-primary'}"
          onclick={handleConfirm}
        >
          {ctrl.pending.options.confirmLabel ?? 'Remove'}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleCancel}>close</button>
    </form>
  </dialog>
{/if}

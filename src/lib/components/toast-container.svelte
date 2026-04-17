<script lang="ts">
  import { getToastState } from './toast-state.svelte';
  const toast = getToastState();
</script>

{#if toast.toasts.length > 0}
  <div
    class="fixed bottom-20 left-0 right-0 z-40 flex flex-col items-center gap-2 px-4 pointer-events-none"
    aria-live="polite"
  >
    {#each toast.toasts as t (t.id)}
      <div
        role="status"
        class="alert shadow-lg pointer-events-auto animate-[slide-up_200ms_ease-out] max-w-md w-full"
      >
        <span class="text-sm flex-1">{t.message}</span>
        {#if t.action}
          <button
            class="btn btn-sm btn-ghost font-normal ml-auto"
            onclick={async () => {
              await t.action!.fn();
              toast.dismiss(t.id);
            }}
          >
            {t.action.label}
          </button>
        {/if}
      </div>
    {/each}
  </div>
{/if}

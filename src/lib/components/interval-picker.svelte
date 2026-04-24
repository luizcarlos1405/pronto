<script lang="ts">
  import WheelSelect from '$lib/components/wheel-select.svelte';

  let {
    interval = $bindable<{ years: number; months: number; weeks: number; days: number }>({
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
    }),
    open = $bindable(false),
  }: {
    interval: { years: number; months: number; weeks: number; days: number };
    open?: boolean;
  } = $props();

  const rangeItems = Array.from({ length: 100 }, (_, i) => i);

  const fields = [
    { key: 'days' as const, label: 'Days' },
    { key: 'weeks' as const, label: 'Weaks' },
    { key: 'months' as const, label: 'Months' },
    { key: 'years' as const, label: 'Years' },
  ];

  let draft = $state({ years: 0, months: 0, weeks: 0, days: 0 });

  $effect(() => {
    if (open) {
      draft = { ...interval };
    }
  });

  function confirm() {
    interval = { ...draft };
    open = false;
  }

  function cancel() {
    open = false;
  }

  function formatInterval(): string {
    const parts: string[] = [];
    if (interval.years) parts.push(`${interval.years} years`);
    if (interval.months) parts.push(`${interval.months} months`);
    if (interval.weeks) parts.push(`${interval.weeks} weeks`);
    if (interval.days) parts.push(`${interval.days} days`);
    return parts.length ? parts.join(' ') : 'Not set';
  }
</script>

<button class="btn btn-sm btn-outline" onclick={() => (open = true)}>
  {formatInterval()}
</button>

<dialog class="modal" class:modal-open={open}>
  <div class="modal-box">
    <div class="flex gap-2">
      {#each fields as field (field.key)}
        <div class="flex-1">
          <WheelSelect items={rangeItems} bind:value={draft[field.key]} label={field.label} />
        </div>
      {/each}
    </div>
    <div class="flex gap-2 mt-4 justify-center">
      <button class="btn btn-ghost btn-sm" onclick={cancel}>Cancel</button>
      <button class="btn btn-primary btn-sm" onclick={confirm}>Select</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button onclick={cancel}>close</button>
  </form>
</dialog>

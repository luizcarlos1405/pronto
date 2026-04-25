<script lang="ts">
  import WheelSelect from '$lib/components/wheel-select.svelte';

  let {
    month = $bindable<string | number>(1),
    day = $bindable<string | number>(1),
    open = $bindable(false),
    editing = false,
    onconfirm,
    onremove,
  }: {
    month?: string | number;
    day?: string | number;
    open?: boolean;
    editing?: boolean;
    onconfirm?: () => void;
    onremove?: () => void;
  } = $props();

  const monthNames = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthItems = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const dayItems = Array.from({ length: 31 }, (_, i) => i + 1);

  function formatMonth(v: string | number): string {
    return monthNames[Number(v)];
  }

  function cancel() {
    open = false;
  }
</script>

<dialog class="modal" class:modal-open={open}>
  <div class="modal-box">
    <div class="flex gap-4">
      <div class="flex-1">
        <WheelSelect
          items={monthItems}
          bind:value={month}
          label="Month"
          cycle={true}
          format={formatMonth}
        />
      </div>
      <div class="flex-1">
        <WheelSelect items={dayItems} bind:value={day} label="Day" cycle={true} />
      </div>
    </div>
    <div class="flex gap-2 mt-4 justify-center">
      {#if editing}
        <button class="btn btn-error btn-outline btn-sm" onclick={onremove}>Remove</button>
      {/if}
      <button class="btn btn-ghost btn-sm ml-auto" onclick={cancel}>Cancel</button>
      <button class="btn btn-primary btn-sm" onclick={onconfirm}>
        {editing ? 'Update' : 'Select'}
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button onclick={cancel}>close</button>
  </form>
</dialog>

<script lang="ts">
  let {
    items,
    value = $bindable<string | number>(),
    label = '',
    cycle = false,
    format = (v: string | number) => String(v),
  }: {
    items: (string | number)[];
    value?: string | number;
    label?: string;
    cycle?: boolean;
    format?: (v: string | number) => string;
  } = $props();

  const ITEM_H = 44;
  const VISIBLE = 5;
  const PAD = Math.floor(VISIBLE / 2);

  let el: HTMLDivElement;
  let scrollPos = $state(0);
  let scrollTimer: ReturnType<typeof setTimeout>;
  let jumping = false;

  let display = $derived(cycle && items.length > 1 ? [...items, ...items, ...items] : items);

  let base = $derived(cycle ? items.length : 0);

  function scrollTo(idx: number, smooth = false) {
    if (!el) return;
    el.scrollTo({
      top: (base + idx) * ITEM_H,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }

  function handleScroll() {
    if (jumping || !el) return;
    scrollPos = el.scrollTop;

    if (cycle && items.length > 1) {
      const n = items.length;
      const midStart = base * ITEM_H;
      const midEnd = (base + n) * ITEM_H;
      if (el.scrollTop < midStart || el.scrollTop >= midEnd) {
        jumping = true;
        const raw = Math.round(el.scrollTop / ITEM_H);
        const idx = (((raw - base) % n) + n) % n;
        const target = (base + idx) * ITEM_H;
        el.scrollTo({ top: target, behavior: 'instant' });
        scrollPos = target;
        requestAnimationFrame(() => {
          jumping = false;
        });
        return;
      }
    }

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(settle, 80);
  }

  function settle() {
    if (!el || !items.length) return;
    const raw = Math.round(el.scrollTop / ITEM_H);
    if (cycle && items.length > 1) {
      const n = items.length;
      const idx = (((raw - base) % n) + n) % n;
      value = items[idx];
    } else {
      const idx = Math.max(0, Math.min(items.length - 1, raw));
      value = items[idx];
    }
  }

  function itemClass(i: number): string {
    const center = PAD * ITEM_H + i * ITEM_H + ITEM_H / 2;
    const view = scrollPos + (VISIBLE * ITEM_H) / 2;
    const dist = Math.abs(center - view) / ITEM_H;
    if (dist < 0.5) return 'text-[28px] font-bold text-primary';
    if (dist < 1.5) return 'text-xl font-medium text-base-content/40';
    return 'text-lg text-base-content/20';
  }

  $effect(() => {
    if (!el || !items.length) return;
    let idx = items.indexOf(value);
    if (idx < 0) idx = 0;
    const target = (base + idx) * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    scrollTo(idx);
  });
</script>

{#if items.length > 0}
  <div class="select-none" role="listbox" aria-label={label || 'Wheel select'}>
    {#if label}
      <p
        class="text-center text-[11px] font-bold uppercase tracking-widest text-base-content/40 mb-2"
      >
        {label}
      </p>
    {/if}

    <div class="relative overflow-hidden rounded-2xl bg-base-100">
      <div
        bind:this={el}
        class="wheel-viewport"
        style="height: {VISIBLE * ITEM_H}px"
        onscroll={handleScroll}
      >
        <div style="height: {PAD * ITEM_H}px" aria-hidden="true"></div>
        {#each display as item, i (i)}
          <div
            class="wheel-item {itemClass(i)}"
            style="height: {ITEM_H}px"
            role="option"
            aria-selected={item === value}
          >
            {format(item)}
          </div>
        {/each}
        <div style="height: {PAD * ITEM_H}px" aria-hidden="true"></div>
      </div>

      <div
        class="absolute left-0 right-0 pointer-events-none border-y-2 border-primary/40"
        style="top: {PAD * ITEM_H}px; height: {ITEM_H}px"
      >
        <div class="absolute inset-0 bg-primary/5"></div>
      </div>

      <div
        class="absolute left-0 right-0 top-0 pointer-events-none"
        style="height: {PAD *
          ITEM_H}px; background: linear-gradient(to bottom, oklch(var(--b1)), transparent);"
      ></div>

      <div
        class="absolute left-0 right-0 bottom-0 pointer-events-none"
        style="height: {PAD *
          ITEM_H}px; background: linear-gradient(to top, oklch(var(--b1)), transparent);"
      ></div>
    </div>
  </div>
{/if}

<style>
  .wheel-viewport {
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .wheel-viewport::-webkit-scrollbar {
    display: none;
  }
  .wheel-item {
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
    transition:
      font-size 100ms ease-out,
      color 100ms ease-out,
      font-weight 100ms ease-out;
  }
</style>

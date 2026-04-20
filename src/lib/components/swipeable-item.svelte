<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';

  let {
    leftBackground,
    rightBackground,
    onswipe,
    children,
    threshold = 80,
    class: className = '',
  }: {
    leftBackground?: Snippet;
    rightBackground?: Snippet;
    onswipe: (direction: 'left' | 'right') => void | Promise<void>;
    children: Snippet;
    threshold?: number;
    class?: string;
  } = $props();

  let startX = $state(0);
  let startY = $state(0);
  let deltaX = $state(0);
  let dragging = $state(false);
  let swiping = $state(false);
  let cancelled = $state(false);

  const REVEAL_WIDTH = 96;
  const DEADZONE = 20;
  const Y_CANCEL_THRESHOLD = 30;

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  function onTouchStart(e: TouchEvent) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = true;
    deltaX = 0;
    cancelled = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (!dragging || cancelled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const rawDeltaX = currentX - startX;
    const rawDeltaY = Math.abs(currentY - startY);

    if (!swiping && rawDeltaY >= Y_CANCEL_THRESHOLD) {
      cancelled = true;
      deltaX = 0;
      return;
    }

    if (!swiping && rawDeltaY > Math.abs(rawDeltaX)) {
      cancelled = true;
      deltaX = 0;
      return;
    }

    if (Math.abs(rawDeltaX) < DEADZONE && !swiping) return;

    swiping = true;

    let clamped = rawDeltaX;

    if (rawDeltaX > 0 && !leftBackground) {
      clamped = 0;
    } else if (rawDeltaX < 0 && !rightBackground) {
      clamped = 0;
    } else {
      clamped = clamp(rawDeltaX, -REVEAL_WIDTH, REVEAL_WIDTH);
    }

    deltaX = clamped;
  }

  async function onTouchEnd() {
    if (!dragging) return;
    dragging = false;

    if (cancelled) {
      cancelled = false;
      swiping = false;
      deltaX = 0;
      return;
    }

    if (Math.abs(deltaX) >= threshold && swiping) {
      const direction = deltaX > 0 ? 'right' : 'left';

      deltaX = direction === 'right' ? 999 : -999;

      await tick();

      await onswipe(direction);

      deltaX = 0;
      swiping = false;
    } else {
      deltaX = 0;
      swiping = false;
    }
  }
</script>

<div class="relative overflow-hidden {className}" style="touch-action: pan-y;" role="group">
  {#if leftBackground}
    <div class="absolute inset-y-0 left-0 flex items-center justify-center w-24">
      {@render leftBackground()}
    </div>
  {/if}

  {#if rightBackground}
    <div class="absolute inset-y-0 right-0 flex items-center justify-center w-24">
      {@render rightBackground()}
    </div>
  {/if}

  <div
    class="relative bg-base-100"
    style="transform: translateX({deltaX}px); transition: {dragging
      ? 'none'
      : 'transform 200ms ease'};"
    role="group"
    aria-roledescription="swipeable"
    ontouchstart={onTouchStart}
    ontouchmove={onTouchMove}
    ontouchend={onTouchEnd}
  >
    {@render children()}
  </div>
</div>

# Reordering Lists

This guide explains how to add drag-to-reorder to a list page. Follow all four steps below. The goals list (`src/routes/goals/`) and cares list (`src/routes/cares/`) are reference implementations.

## 1. Add a list-order field to the doc type

In `src/lib/types.ts`, add an optional `<entity>ListOrder` field to the doc interface:

```ts
export interface GoalDoc {
  // ... existing fields
  goalsListOrder?: number; // <-- add this
}
```

## 2. Update the repo (`src/lib/db/<entity>-repo.ts`)

Three changes are needed:

### 2a. Assign order on creation

```ts
export async function createGoal(title: string): Promise<GoalDoc> {
  const now = new Date().toISOString();
  const existing = await getAllGoals();
  const maxOrder = existing.reduce((max, g) => Math.max(max, g.goalsListOrder ?? -1), -1);
  const doc: GoalDoc = {
    // ...
    goalsListOrder: maxOrder + 1
  };
  // ...
}
```

### 2b. Sort by order on read

```ts
export async function getAllGoals(): Promise<GoalDoc[]> {
  // ... PouchDB query
  const goals = result.docs as GoalDoc[];
  return goals.toSorted((a, b) => {
    const orderA = a.goalsListOrder ?? Infinity;
    const orderB = b.goalsListOrder ?? Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
```

Items without a `listOrder` field (created before reordering was added) are treated as `Infinity`, so they sort to the end, with `createdAt` as tiebreaker.

### 2c. Add a reorder function

```ts
export async function reorderGoals(goalIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < goalIds.length; i++) {
    const doc = await db.get<GoalDoc>(goalIds[i]);
    doc.goalsListOrder = i;
    doc.updatedAt = new Date().toISOString();
    await db.put(doc);
  }
}
```

## 3. Update the page state (`<entity>-page-state.svelte.ts`)

Import `reorderItems` from `$lib/utils/reorderItems` and the reorder repo function. Add two methods:

```ts
function reorder(fromIndex: number, toIndex: number) {
  items = reorderItems(items, fromIndex, toIndex, (item, i) => {
    item.goalsListOrder = i;
  });
}

async function persistOrder() {
  const itemIds = items.map((g) => g._id);
  await reorderGoals(itemIds);
}
```

Expose both on the returned object.

## 4. Update the page component (`+page.svelte`)

### Markup pattern

Use a DaisyUI `<ul class="list">` with `<li class="list-row">` children. Attach `orderableChildren` to the `<ul>`, and use `list-col-grow` on the main content element to fill available grid space (DaisyUI `list-row` is `display: grid`, so `flex-1` has no effect).

```svelte
<script lang="ts">
  import GripVertical from 'lucide-svelte/icons/grip-vertical';
  import { orderableChildren } from '$lib/attachments/orderableChildren';
  import { flip } from 'svelte/animate';

  const ctrl = getPageState();
  let isDragging = $state(false);
</script>

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
  {#each ctrl.items as item (item._id)}
    <li class="list-row bg-base-100 w-full" animate:flip={{ duration: 200 }}>
      <a
        href={resolve(`/items/${item._id}`)}
        class="list-col-grow hover:bg-base-200 transition-colors rounded-lg p-2 -m-2"
      >
        <!-- item content -->
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
```

### Key details

- **`animate:flip`** on each `<li>` makes items animate smoothly when the array is reordered. Requires keyed `{#each}`.
- **`handleSelector: '.drag-handle'`** restricts drag start to the grip icon so links and buttons still work normally.
- **`list-col-grow`** tells the grid to give the remaining space to that column. Without it, each grid column is only as wide as its content (`minmax(0, auto)`).
- **`isDragging`** toggles `cursor-grab`/`cursor-grabbing` on all handles simultaneously.
- **`startEvents: ['mousedown', 'touchstart']`** enables both mouse and touch reordering.

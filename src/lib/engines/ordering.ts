export function computeInsertBeforeDone(
  items: Array<{ stepOrder?: number | null; status: string }>,
): {
  newStepOrder: number;
  reindexed: Array<{ index: number; stepOrder: number }>;
} {
  if (items.length === 0) return { newStepOrder: 0, reindexed: [] };

  const indexed = items.map((item, i) => ({
    stepOrder: item.stepOrder,
    status: item.status,
    _i: i,
  }));
  indexed.sort((a, b) => (a.stepOrder ?? Infinity) - (b.stepOrder ?? Infinity));

  const todos = indexed.filter((x) => x.status === 'TODO');
  const dones = indexed.filter((x) => x.status === 'DONE');
  const newStepOrder = todos.length;

  const reindexed: Array<{ index: number; stepOrder: number }> = [];

  todos.forEach((item, i) => {
    if ((item.stepOrder ?? -1) !== i) {
      reindexed.push({ index: item._i, stepOrder: i });
    }
  });

  dones.forEach((item, i) => {
    const desired = newStepOrder + 1 + i;
    if ((item.stepOrder ?? -1) !== desired) {
      reindexed.push({ index: item._i, stepOrder: desired });
    }
  });

  return { newStepOrder, reindexed };
}

export function nextOrder(existingOrders: (number | undefined | null)[]): number {
  const max: number = existingOrders.reduce<number>((m, o) => {
    const val: number = o != null ? o : -1;
    return Math.max(m, val);
  }, -1);
  return max + 1;
}

export function byListOrder<T extends { createdAt: string }>(
  getOrder: (item: T) => number | undefined | null,
): (a: T, b: T) => number {
  return (a, b) => {
    const oA: number = getOrder(a) ?? Infinity;
    const oB: number = getOrder(b) ?? Infinity;
    if (oA !== oB) return oA - oB;
    return b.createdAt.localeCompare(a.createdAt);
  };
}

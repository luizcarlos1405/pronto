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

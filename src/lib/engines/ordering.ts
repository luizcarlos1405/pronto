export function nextOrder(existingOrders: (number | undefined | null)[]): number {
  const max: number = existingOrders.reduce<number>((m, o) => {
    const val: number = o != null ? o : -1;
    return Math.max(m, val);
  }, -1);
  return max + 1;
}

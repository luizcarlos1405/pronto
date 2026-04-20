export function reorderItems<T>(
  items: T[],
  fromIndex: number,
  toIndex: number,
  setOrder: (item: T, index: number) => void,
): T[] {
  const reordered = [...items];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  reordered.forEach((item, i) => setOrder(item, i));
  return reordered;
}

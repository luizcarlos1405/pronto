import { describe, it, expect } from 'vitest';
import { reorderItems } from '../reorderItems';

describe('reorderItems', () => {
  const letters = (orders: number[]) => {
    const items = orders.map((o, i) => ({ id: String.fromCharCode(65 + i), order: o }));
    const setOrder = (item: (typeof items)[number], index: number) => {
      item.order = index;
    };
    return { items, setOrder };
  };

  it('moves item forward', () => {
    const { items, setOrder } = letters([0, 1, 2, 3]);
    const result = reorderItems(items, 0, 3, setOrder);
    expect(result.map((i) => i.id)).toEqual(['B', 'C', 'D', 'A']);
  });

  it('moves item backward', () => {
    const { items, setOrder } = letters([0, 1, 2, 3]);
    const result = reorderItems(items, 3, 0, setOrder);
    expect(result.map((i) => i.id)).toEqual(['D', 'A', 'B', 'C']);
  });

  it('handles move to same position', () => {
    const { items, setOrder } = letters([0, 1, 2]);
    const result = reorderItems(items, 1, 1, setOrder);
    expect(result.map((i) => i.id)).toEqual(['A', 'B', 'C']);
  });

  it('handles single item', () => {
    const items = [{ id: 'X', order: 0 }];
    const setOrder = (item: (typeof items)[0], index: number) => {
      item.order = index;
    };
    const result = reorderItems(items, 0, 0, setOrder);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('X');
  });

  it('moves to last position', () => {
    const { items, setOrder } = letters([0, 1, 2]);
    const result = reorderItems(items, 0, 2, setOrder);
    expect(result.map((i) => i.id)).toEqual(['B', 'C', 'A']);
  });

  it('calls setOrder with sequential indices', () => {
    const items = [
      { id: 'A', order: 10 },
      { id: 'B', order: 20 },
      { id: 'C', order: 30 },
    ];
    const calls: { id: string; order: number }[] = [];
    const setOrder = (item: (typeof items)[0], index: number) => {
      calls.push({ id: item.id, order: index });
    };
    reorderItems(items, 0, 2, setOrder);
    expect(calls).toEqual([
      { id: 'B', order: 0 },
      { id: 'C', order: 1 },
      { id: 'A', order: 2 },
    ]);
  });

  it('does not mutate the original array', () => {
    const items = [
      { id: 'A', order: 0 },
      { id: 'B', order: 1 },
      { id: 'C', order: 2 },
    ];
    const originalIds = items.map((i) => i.id);
    const setOrder = (_item: (typeof items)[0], _index: number) => {};
    reorderItems(items, 0, 2, setOrder);
    expect(items.map((i) => i.id)).toEqual(originalIds);
  });

  it('reorders two-item array', () => {
    const { items, setOrder } = letters([0, 1]);
    const result = reorderItems(items, 1, 0, setOrder);
    expect(result.map((i) => i.id)).toEqual(['B', 'A']);
  });
});

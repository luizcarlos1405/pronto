import { describe, it, expect } from 'vitest';
import { nextOrder, byListOrder, computeInsertBeforeDone } from '../ordering';

describe('nextOrder', () => {
  it('returns 0 for empty array', () => {
    expect(nextOrder([])).toBe(0);
  });

  it('returns max + 1 for positive orders', () => {
    expect(nextOrder([5, 3, 8])).toBe(9);
  });

  it('treats null as -1', () => {
    expect(nextOrder([null, 2])).toBe(3);
  });

  it('treats undefined as -1', () => {
    expect(nextOrder([undefined, 2])).toBe(3);
  });

  it('returns 0 when all values are null', () => {
    expect(nextOrder([null, null])).toBe(0);
  });

  it('returns 0 when all values are undefined', () => {
    expect(nextOrder([undefined, undefined])).toBe(0);
  });

  it('returns 0 for negative orders', () => {
    expect(nextOrder([-5, -1])).toBe(0);
  });

  it('returns 1 for single order of 0', () => {
    expect(nextOrder([0])).toBe(1);
  });

  it('handles mixed null, undefined, and numeric', () => {
    expect(nextOrder([null, undefined, 0, 5])).toBe(6);
  });
});

describe('byListOrder', () => {
  interface Item {
    _id: string;
    createdAt: string;
    order?: number | null;
  }

  const makeItem = (overrides: Partial<Item> & { _id: string }): Item => ({
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  it('sorts by order ascending', () => {
    const items = [
      makeItem({ _id: 'b', order: 2 }),
      makeItem({ _id: 'a', order: 0 }),
      makeItem({ _id: 'c', order: 5 }),
    ];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted.map((i) => i._id)).toEqual(['a', 'b', 'c']);
  });

  it('places items with null order after defined orders', () => {
    const items = [makeItem({ _id: 'x', order: null }), makeItem({ _id: 'a', order: 0 })];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted.map((i) => i._id)).toEqual(['a', 'x']);
  });

  it('places items with undefined order after defined orders', () => {
    const items = [makeItem({ _id: 'x', order: undefined }), makeItem({ _id: 'a', order: 0 })];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted.map((i) => i._id)).toEqual(['a', 'x']);
  });

  it('breaks ties by createdAt descending (newer first)', () => {
    const items = [
      makeItem({ _id: 'older', createdAt: '2026-01-01T00:00:00Z' }),
      makeItem({ _id: 'newer', createdAt: '2026-01-02T00:00:00Z' }),
    ];
    const sorted = [...items].sort(byListOrder(() => 5));
    expect(sorted.map((i) => i._id)).toEqual(['newer', 'older']);
  });

  it('sorts entirely by createdAt when all orders are undefined', () => {
    const items = [
      makeItem({ _id: 'c', order: undefined, createdAt: '2026-01-03T00:00:00Z' }),
      makeItem({ _id: 'a', order: undefined, createdAt: '2026-01-01T00:00:00Z' }),
      makeItem({ _id: 'b', order: undefined, createdAt: '2026-01-02T00:00:00Z' }),
    ];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted.map((i) => i._id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts null-order items by createdAt among themselves', () => {
    const items = [
      makeItem({ _id: 'old_null', order: null, createdAt: '2026-01-01T00:00:00Z' }),
      makeItem({ _id: 'new_null', order: null, createdAt: '2026-01-05T00:00:00Z' }),
      makeItem({ _id: 'ordered', order: 0, createdAt: '2026-01-03T00:00:00Z' }),
    ];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted.map((i) => i._id)).toEqual(['ordered', 'new_null', 'old_null']);
  });

  it('handles single item', () => {
    const items = [makeItem({ _id: 'only', order: 5 })];
    const sorted = [...items].sort(byListOrder((i) => i.order));
    expect(sorted).toHaveLength(1);
    expect(sorted[0]._id).toBe('only');
  });

  it('sorts empty array without error', () => {
    const sorted = [].sort(byListOrder((_i: Item) => 0));
    expect(sorted).toEqual([]);
  });
});

describe('computeInsertBeforeDone', () => {
  it('returns 0 for empty list', () => {
    const result = computeInsertBeforeDone([]);
    expect(result.newStepOrder).toBe(0);
    expect(result.reindexed).toEqual([]);
  });

  it('places new task after all TODO items when no DONE items', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: 0, status: 'TODO' },
      { stepOrder: 1, status: 'TODO' },
    ]);
    expect(result.newStepOrder).toBe(2);
    expect(result.reindexed).toEqual([]);
  });

  it('places new task before all DONE items when no TODO items', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: 0, status: 'DONE' },
      { stepOrder: 1, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(0);
    expect(result.reindexed).toEqual([
      { index: 0, stepOrder: 1 },
      { index: 1, stepOrder: 2 },
    ]);
  });

  it('places new task between TODO and DONE items', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: 0, status: 'TODO' },
      { stepOrder: 1, status: 'TODO' },
      { stepOrder: 2, status: 'DONE' },
      { stepOrder: 3, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(2);
    expect(result.reindexed).toEqual([
      { index: 2, stepOrder: 3 },
      { index: 3, stepOrder: 4 },
    ]);
  });

  it('only returns items whose stepOrder actually changed', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: 0, status: 'TODO' },
      { stepOrder: 2, status: 'DONE' },
      { stepOrder: 3, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(1);
    expect(result.reindexed).toEqual([]);
  });

  it('handles single DONE item', () => {
    const result = computeInsertBeforeDone([{ stepOrder: 0, status: 'DONE' }]);
    expect(result.newStepOrder).toBe(0);
    expect(result.reindexed).toEqual([{ index: 0, stepOrder: 1 }]);
  });

  it('handles single TODO item', () => {
    const result = computeInsertBeforeDone([{ stepOrder: 0, status: 'TODO' }]);
    expect(result.newStepOrder).toBe(1);
    expect(result.reindexed).toEqual([]);
  });

  it('treats undefined stepOrder as Infinity for sorting', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: undefined, status: 'TODO' },
      { stepOrder: 0, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(1);
    expect(result.reindexed).toEqual([
      { index: 0, stepOrder: 0 },
      { index: 1, stepOrder: 2 },
    ]);
  });

  it('treats null stepOrder as Infinity for sorting', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: null, status: 'TODO' },
      { stepOrder: 0, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(1);
    expect(result.reindexed).toEqual([
      { index: 0, stepOrder: 0 },
      { index: 1, stepOrder: 2 },
    ]);
  });

  it('does not mutate the input array', () => {
    const input = [
      { stepOrder: 0, status: 'TODO' },
      { stepOrder: 1, status: 'DONE' },
    ];
    const copy = input.map((i) => ({ ...i }));
    computeInsertBeforeDone(input);
    expect(input).toEqual(copy);
  });

  it('handles items with gaps in stepOrder', () => {
    const result = computeInsertBeforeDone([
      { stepOrder: 5, status: 'TODO' },
      { stepOrder: 10, status: 'DONE' },
    ]);
    expect(result.newStepOrder).toBe(1);
    expect(result.reindexed).toEqual([
      { index: 0, stepOrder: 0 },
      { index: 1, stepOrder: 2 },
    ]);
  });
});

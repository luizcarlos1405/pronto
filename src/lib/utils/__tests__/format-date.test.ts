import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { formatFriendlyDate } from '../format-date';

function pd(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

describe('formatFriendlyDate', () => {
  it('returns "Today" for today', () => {
    expect(formatFriendlyDate('2026-03-15', pd('2026-03-15'))).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    expect(formatFriendlyDate('2026-03-16', pd('2026-03-15'))).toBe('Tomorrow');
  });

  it('returns "Yesterday" for yesterday', () => {
    expect(formatFriendlyDate('2026-03-14', pd('2026-03-15'))).toBe('Yesterday');
  });

  it('returns formatted date without year for same-year dates', () => {
    const result = formatFriendlyDate('2026-06-20', pd('2026-03-15'));
    expect(result).toMatch(/jun/i);
    expect(result).toContain('20');
    expect(result).not.toContain('2026');
  });

  it('includes year for different-year dates', () => {
    const result = formatFriendlyDate('2027-03-15', pd('2026-03-15'));
    expect(result).toContain('2027');
  });

  it('returns formatted date for 2 days ago', () => {
    const result = formatFriendlyDate('2026-03-13', pd('2026-03-15'));
    expect(result).toMatch(/mar/i);
    expect(result).toContain('13');
  });

  it('returns formatted date for 2 days from now', () => {
    const result = formatFriendlyDate('2026-03-17', pd('2026-03-15'));
    expect(result).toMatch(/mar/i);
    expect(result).toContain('17');
  });

  it('handles date far in the past with year', () => {
    const result = formatFriendlyDate('2024-01-01', pd('2026-06-15'));
    expect(result).toContain('2024');
  });

  it('handles date far in the future with year', () => {
    const result = formatFriendlyDate('2030-12-25', pd('2026-06-15'));
    expect(result).toContain('2030');
  });

  it('year boundary yesterday returns Yesterday', () => {
    const result = formatFriendlyDate('2025-12-31', pd('2026-01-01'));
    expect(result).toBe('Yesterday');
  });
});

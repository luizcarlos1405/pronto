import { Temporal } from '@js-temporal/polyfill';

export function formatFriendlyDate(
  isoDate: string,
  today: Temporal.PlainDate = Temporal.Now.plainDateISO(),
): string {
  const date = Temporal.PlainDate.from(isoDate);
  const diff = date.until(today, { largestUnit: 'day' }).days;

  if (diff === 0) return 'Today';
  if (diff === -1) return 'Tomorrow';
  if (diff === 1) return 'Yesterday';

  const sameYear = date.year === today.year;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

import { test, expect } from '@playwright/test';

const pages = [
  { path: '/tasks', name: 'Tasks' },
  { path: '/inbox', name: 'Inbox' },
  { path: '/goals', name: 'Goals' },
  { path: '/cares', name: 'Cares' }
];

for (const { path, name } of pages) {
  test(`${name} page loads without console errors`, async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/#' + path);
    await page.waitForSelector('nav.dock');

    expect(errors).toEqual([]);
  });
}

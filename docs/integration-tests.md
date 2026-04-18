# Integration Tests

Headless browser tests using [Playwright](https://playwright.dev/) via `@playwright/test`.

## Running

```sh
bun run test:e2e
```

This starts the dev server automatically (if not already running), opens each test page in headless Chromium, and reports results.

**NixOS:** run inside `nix-shell shell.nix` so Playwright's Chromium can find system libraries.

### Single file

```sh
npx playwright test e2e/pages-load-cleanly.spec.ts
```

### Debugging

```sh
npx playwright test --headed          # visible browser
npx playwright test --ui              # Playwright UI mode
npx playwright test --debug           # step-through debugger
```

## Conventions

- **Location:** `e2e/` directory at project root
- **File extension:** `*.spec.ts`
- **Config:** `playwright.config.ts` at project root
- **Browser:** Chromium only (no Firefox/WebKit — keep it fast)
- **Server:** tests run against the dev server (`bun run dev`)

These are separate from the unit tests (`bun run test` / vitest). The two configs and file locations don't overlap.

## Adding a new test

1. Create a file in `e2e/` with a `.spec.ts` extension
2. Import `test` and `expect` from `@playwright/test`
3. Use the standard Playwright API — the `baseURL` is already configured so you can `page.goto('/#/your-path')`
4. Run `bun run test:e2e` to verify

### Console error checking

To assert that a page produces no console errors, capture them as the test above does:

```ts
const errors: string[] = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});
page.on('pageerror', (err) => {
  errors.push(err.message);
});

// ... navigate and interact ...

expect(errors).toEqual([]);
```

`pageerror` catches unhandled exceptions that don't appear as console messages.

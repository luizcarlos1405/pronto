# Faz

Personal GTD/task organization PWA. SvelteKit 5, client-only SPA, PouchDB (browser), Tailwind CSS v4 + DaisyUI v5.

ATTENTION: update this file anytime you notice a discrepancy between its contents and the reality of
the codebase.

## Commands

**Important:** On NixOS, all commands (including `bun run dev` and `playwright-cli`) must run inside the nix-shell to provide shared libraries for Playwright's Chromium:

```
nix-shell shell.nix
```

- `bun install` — package manager is bun (lockfile is `bun.lock`)
- `bun run dev` — dev server
- `bun run check` — typecheck via svelte-check
- `bun run lint` — prettier + eslint (run both, not just one)
- `bun run test` — vitest (single run)
- `bun run test -- src/lib/engines/__tests__/care-engine.test.ts` — single test file

No build step needed before check/lint/test.

## Architecture

- **Svelte 5 runes mode** — enabled for all non-node_modules files via `svelte.config.js` `compilerOptions.runes`. Use `$state`, `$derived`, `$props`, `$effect` — not legacy `export let` or stores.
- **SPA / static** — `adapter-static` with `fallback: '200.html'`. SSR disabled (`+layout.ts`: `ssr = false`, `prerender = true`).
- **Client-only DB** — PouchDB (`pouchdb-browser`) in `src/lib/db/database.ts`. Singleton via `getDb()`. All data lives in browser IndexedDB.
- **Temporal API** — date logic uses `@js-temporal/polyfill` (`Temporal.PlainDate`). Do not use native `Date` for date arithmetic.

### Key domains (`src/lib/`)

| Path           | Purpose                                                                                 |
| -------------- | --------------------------------------------------------------------------------------- |
| `db/`          | PouchDB repos (task, goal, care, inbox)                                                 |
| `engines/`     | Pure business logic: recurrence scheduling (`care-engine`), goal status (`goal-engine`) |
| `components/`  | UI components (`.svelte` and `.svelte.ts` reactive state helpers)                       |
| `scheduler.ts` | Orchestrator — runs care-engine on mount, polls every 5 min                             |
| `types.ts`     | All doc types and recurrence type unions                                                |

### Routes (`src/routes/`)

`/tasks`, `/inbox`, `/goals`, `/cares` — bottom nav tabs. Root `/` redirects to `/tasks`.

### Recurrence model

5 recurrence types in `types.ts`: `INTERVAL/FIXED`, `INTERVAL/AFTER_DONE`, `FIXED_DAYS/WEEKDAYS`, `FIXED_DAYS/MONTHDAYS`, `FIXED_DAYS/YEARDAYS`. Engines are pure functions with no DB access — they receive data and return results.

## Related Docs

[Writing guide](./docs/WRITING.md): when working on user-facing copy (labels,
empty states, error messages, notifications, onboarding text), read it for tone and voice guidelines.

[Reordering lists](./docs/reordering-lists.md): when adding or modifying drag-to-reorder
on a list page, read it for the full pattern (type, repo, state, component).

## Style

- Spaces, single quotes, no trailing commas, 100 char width (`.prettierrc`)
- No comments unless explicitly asked
- Icons: `lucide-svelte`
- UI: DaisyUI components (dock nav, etc.)
- **Modals** — Always render `<dialog class="modal">` in the DOM; toggle visibility with `class:modal-open={open}`. Never wrap a `<dialog>` in `{#if}` — destroying the element skips DaisyUI's CSS transition animations. Pass an `open` boolean prop instead.
- No `index.ts` barrel files — every file gets a meaningful, specific name

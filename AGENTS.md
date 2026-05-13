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
- `bun run test:e2e` — Playwright integration tests (headless browser)

No build step needed before check/lint/test.

## Architecture

- **Svelte 5 runes mode** — enabled for all non-node_modules files via `svelte.config.js` `compilerOptions.runes`. Use `$state`, `$derived`, `$props`, `$effect` — not legacy `export let` or stores.
- **SPA / static** — `adapter-static` with `fallback: '200.html'`. SSR disabled (`+layout.ts`: `ssr = false`). Uses hash router (`router.type: 'hash'` in `svelte.config.js`) so all URLs use `#/path` format — this ensures refresh works on dynamic routes like `/goals/[id]` without server-side routing.
- **Client-only DB** — PouchDB (`pouchdb-browser`) in `src/lib/db/database.ts`. Singleton via `getDb()`. All data lives in browser IndexedDB.
- **Temporal API** — all date/time logic uses `@js-temporal/polyfill`. Never use the legacy `Date` object. Use `Temporal.Now.instant().toString()` for timestamps, `Temporal.Now.plainDateISO().toString()` for today's date, and `Temporal.PlainDate` / `Temporal.Instant` for all date arithmetic and formatting.

### Functional Core, Imperative Shell (FCIS)

Code is split in two layers. The **functional core** is pure: deterministic functions that take values and return values, with no I/O, no wall-clock access for calculations, no DB access. The **imperative shell** does everything else: PouchDB reads/writes, DOM manipulation, UI state, env access. The shell gathers inputs, calls the core for decisions, then carries out the consequences.

#### Core (`engines/`, pure `utils/`)

Pure functions only — values in, values out:

**Exception:** Creation-time metadata generation (`createdAt`/`updatedAt` timestamps via `Temporal.Now`, `_id` via `nanoid()`) is acceptable inside creation functions. These values are metadata only — never fed back into calculations or decisions.

- No imports from `db/` or `components/` (enforced by ESLint `no-restricted-imports` on `engines/**`)
- No `Temporal.Now` for calculation inputs — if a function needs "today", it receives it as a parameter
- No mutation of inputs — return new values
- No DOM access, no `$state`, no side effects

Core modules: `care-engine.ts` (recurrence scheduling), `goal-engine.ts` (goal status), `ordering.ts` (list ordering decisions, sort comparators), `format-date.ts` (date formatting), `reorderItems.ts`, `snapshotTask` in `task-undo.ts`.

#### Shell (`db/`, `scheduler.ts`, `importers/*-import.ts`, `components/`, `attachments/`, route pages)

The shell's job is to gather inputs from the outside world (DB, user interaction, file system), hand them to the core for a decision, then carry out the decision's consequences. Shell modules may import from core and from `types.ts`.

Typical shell pattern (scheduler, repos, importers):

1. **Shell gathers inputs** (fetch data from PouchDB, read a file, read user input)
2. **Core makes the decision** (call `runScheduler()`, `nextOrder()`, `parseGoogleTasksExport()`)
3. **Shell performs consequences** (write to DB, show toast, navigate)

#### Boundary (`types.ts`)

Domain types (`TaskDoc`, `GoalDoc`, `CareDoc`, `InboxItemDoc`, `Recurrence`, etc.) are imported by both layers. Types only, no behavior.

### Key domains (`src/lib/`)

| Path           | Layer  | Purpose                                                                                     |
| -------------- | ------ | ------------------------------------------------------------------------------------------- |
| `engines/`     | Core   | Pure business logic: recurrence scheduling, goal status, ordering, import parsing           |
| `utils/`       | Core   | Pure utilities: date formatting, reordering, snapshot                                       |
| `types.ts`     | Bound. | All doc types and recurrence type unions                                                    |
| `db/`          | Shell  | PouchDB repos (task, goal, care, inbox, data-manager). Calls core for ordering decisions.   |
| `scheduler.ts` | Shell  | Orchestrator — gathers DB data, calls `runScheduler()`, writes results back                 |
| `importers/`   | Split  | `google-tasks.ts` = core (parsing), `google-tasks-import.ts` = shell (file I/O + DB writes) |
| `components/`  | Shell  | UI components (`.svelte`) and `.svelte.ts` reactive state helpers                           |
| `attachments/` | Shell  | DOM-level drag-and-drop attachment                                                          |

### Routes (`src/routes/`)

`/tasks`, `/inbox`, `/goals`, `/cares` — bottom nav tabs. Root `/`
redirects to `/tasks`.

## Related Docs

[Writing guide](./docs/WRITING.md): when working on user-facing copy
(labels, empty states, error messages, notifications, onboarding text),
read it for tone and voice guidelines.

[Reordering lists](./docs/reordering-lists.md): when adding or modifying
drag-to-reorder on a list page, read it for the full pattern (type,
repo, state, component).

[Integration tests](./docs/integration-tests.md): when adding or modifying
browser-level tests, read it for setup details and conventions.

[DaisyUI](https://daisyui.com/llms.txt): when doing UI work.

## Style

- Spaces, single quotes, no trailing commas, 100 char width (`.prettierrc`)
- No comments unless explicitly asked
- Primary actions to the right: `cancel | save` never `save | cancel`. - Icons: `lucide-svelte`
- UI: DaisyUI components (dock nav, etc.)
- **Modals** — Always render `<dialog class="modal">` in the DOM; toggle visibility with `class:modal-open={open}`. Never wrap a `<dialog>` in `{#if}` — destroying the element skips DaisyUI's CSS transition animations. Pass an `open` boolean prop instead.
- **No `Date`** — Never use `new Date()` or the native `Date` object anywhere. Always use `@js-temporal/polyfill` (`Temporal`) for all date/time operations: timestamps, date arithmetic, and formatting.
- No `index.ts` barrel files — every file gets a meaningful, specific name

# Faz

Personal GTD/task organization PWA. Built with SvelteKit 5, Tailwind CSS v4 + DaisyUI v5, and PouchDB (all data lives in your browser's IndexedDB).

## Prerequisites

- [Bun](https://bun.sh/) (package manager and runtime)
- Node.js (for tooling compatibility)

## Setup

```sh
bun install
```

On NixOS, all commands must run inside the nix-shell (provides shared libraries for Playwright's Chromium):

```sh
nix-shell shell.nix
```

## Development

Start the dev server:

```sh
bun run dev

# or start and open in a browser
bun run dev -- --open
```

The app uses a hash router (`#/path`), so all navigation is client-side. Refresh works on any route.

## Building

```sh
bun run build
bun run preview
```

The build produces a static SPA (`adapter-static`, `200.html` fallback) ready for any static host.

## Testing

**Unit tests** (Vitest):

```sh
bun run test                # single run
bun run test:watch          # watch mode
bun run test -- src/lib/engines/__tests__/care-engine.test.ts  # single file
```

**End-to-end tests** (Playwright):

```sh
bun run test:e2e
```

> On NixOS, run `nix-shell shell.nix` first.

## Code quality

```sh
bun run check    # typecheck (svelte-check)
bun run lint     # prettier + eslint
bun run format   # auto-fix formatting
```

Pre-commit hooks (via [Lefthook](https://github.com/evilmartians/lefthook)) run lint and typecheck automatically.

## Project structure

```
src/lib/
  engines/      Pure business logic (recurrence, goals, ordering)
  utils/        Pure utilities (date formatting, reordering)
  types.ts      Shared domain types
  db/           PouchDB repositories (shell layer)
  scheduler.ts  Orchestrator — gathers DB data, runs engine, writes back
  importers/    Import parsers and file I/O
  components/   Svelte UI components
  attachments/  Drag-and-drop file attachments
src/routes/     Pages: /tasks, /inbox, /goals, /cares
e2e/            Playwright integration tests
```

## License

Private project.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# General Guidelines

## Running the app

```sh
npx nx dev api   # http://localhost:3000, API docs at /docs
npx nx dev web   # http://localhost:4200
```

The web app talks to the API over `API_BASE_URL` (defaults to `http://localhost:3000`) and
sends `API_AUTH_TOKEN` as a bearer token when set (see [Auth](#bonus-authentication--authorization-theoretical)).

Other useful commands:

```sh
npx nx run-many -t lint test typecheck   # lint, unit tests, typecheck across every project
npx nx e2e web-e2e                       # Playwright e2e (boots both api and web itself)
npx nx run @itp-home-garden/web:build    # production build of the frontend
```

## Tech Stack

- Nx monorepo
- Next.js Frontend 

## Architecture

```
apps/
  api/                        Fastify backend (unchanged, aside from importing shared code)
  web/                        Next.js App Router app — routing/composition only

libs/
  shared/
    api-contracts/            zod schemas + inferred types (Garden, Plant) — single source of truth
    domain/                   pure business rules: garden-capacity/overcrowding calculation
  web/
    api-client/                generic resilient fetch: retry + backoff + timeout, no domain knowledge
    data-access-gardens/       garden CRUD, Server Actions, cache tags
    data-access-plants/        plant CRUD, Server Actions, cache tags
    ui/                        presentational primitives (Button, Card, Input, ProgressBar, …)
    feature-gardens/           garden list/detail/create/edit UI
    feature-plants/            plant list/form/capacity-meter UI
```

Dependency rules (`eslint.config.mjs`):

```
type:app          → feature, data-access, ui, util
type:feature       → feature, ui, data-access, util
type:data-access  → data-access, util
type:ui             → util
type:util           → util

scope:web    → web, shared      (never api)
scope:api    → api, shared      (never web)
scope:shared → shared           (a pure leaf)
```


## Testing

```sh
npx nx run-many -t test typecheck lint
npx nx e2e web-e2e
```

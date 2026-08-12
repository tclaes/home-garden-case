# Home Garden

A web UI for managing gardens and plants, built on top of the provided (intentionally slow and
flaky) Fastify backend. This README documents the architectural choices, technical approach, and
implementation decisions behind the frontend in `apps/web` and `libs/web/*`.

## Contents

- [Prerequisites](#prerequisites)
- [Running the app](#running-the-app)
- [Tech stack — Next.js over Remix](#tech-stack--nextjs-over-remix)
- [Architecture: Nx libraries with enforced boundaries](#architecture-nx-libraries-with-enforced-boundaries)
- [Handling a slow, unreliable backend](#handling-a-slow-unreliable-backend)
- [Caching strategy](#caching-strategy)
- [The overcrowding rule](#the-overcrowding-rule)
- [Testing](#testing)
- [Bonus: making the API faster](#bonus-making-the-api-faster-theoretical)
- [Bonus: authentication & authorization](#bonus-authentication--authorization-theoretical)
- [Known limitations / what I'd do next](#known-limitations--what-id-do-next)

## Prerequisites

Node.js installed, then:

```sh
npm install
```

## Running the app

Run the backend and the frontend in two terminals:

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

## Tech stack — Next.js over Remix

The case explicitly allows either. I picked **Next.js (App Router)** over Remix / React Router
for three reasons, roughly in order of weight:

1. **Caching is a first-class Next primitive.** The case asks for "a theoretical way to speed up
   the application for frequently used data." Next's Data Cache + tag-based `revalidateTag` let
   me *implement* that, not just describe it — see [Caching strategy](#caching-strategy). With
   Remix/React Router you'd build that layer yourself around the loaders.
2. **Continuity.** `@remix-run/react` is pinned at 2.17.5 in the npm registry; the project has
   folded into React Router (now v8), and Remix v3 is a separate rewrite. Next is one continuous,
   unambiguous line to build on.
3. **Streaming + Server Actions map directly onto the two real constraints of this case**: a slow
   API (`libs/web/*` streams each section in via `<Suspense>` instead of blocking the whole page)
   and a flaky one (Server Actions return a typed result instead of throwing, so failures render
   inline instead of crashing the page).

`@nx/next` and `@nx/remix` are both at the same Nx version, so there was no tooling tie-breaker.

## Architecture: Nx libraries with enforced boundaries

The frontend lives inside this monorepo (not a separate repo) specifically so it can share the
backend's zod schemas as a single source of truth — see `libs/shared/api-contracts`. The workspace
is split into small libraries, each tagged with a `scope` and a `type`, and
[`eslint.config.mjs`](eslint.config.mjs) turns those tags into hard `@nx/enforce-module-boundaries`
rules (a violation is a lint error, not a code-review comment).

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

In practice this means: `web-ui` can never import a Server Action, `data-access-*` can never
import a React component, `apps/api` can never depend on anything under `libs/web`, and
`shared/domain` / `shared/api-contracts` are leaves both `apps/api` and `apps/web` can depend on
without ever depending on each other.

**`shared/domain` is the one piece of business logic duplicated nowhere.** The overcrowding rule
(`checkGardenCapacity` / `sumPlantSurfaceArea`) used to live only in `apps/api`'s `PlantService`.
It's now a pure function in `libs/shared/domain`, imported by both the backend service (as the
source of truth) and `PlantSurfaceAreaField` in `feature-plants` (for the live "would overcrowd
the garden" preview while typing). The two can never disagree about what "too full" means, because
they're calling the same code.

## Handling a slow, unreliable backend

Every request through [`slow-api.ts`](apps/api/src/app/plugins/slow-api.ts) gets a 200–2000ms
delay, and [`random-errors.ts`](apps/api/src/app/plugins/random-errors.ts) gives every non-`/docs`
request (including mutations) a 10% chance of a 500. `libs/web/api-client`'s `resilientFetch`
wraps every call with:

- an `AbortController`-based timeout (default 5s)
- exponential backoff with jitter on 5xx/network failures (`libs/web/api-client/src/lib/backoff.ts`)
- zod validation of the parsed response

**Retries are opt-in per call, based on HTTP idempotency — not a blanket policy:**

| Method | Retries | Why |
|---|---|---|
| `GET` (reads) | 2 | Idempotent — safe to retry freely. 10% failure rate → ~0.1% chance of all 3 attempts failing. |
| `PUT` / `DELETE` | 2 | Idempotent by HTTP semantics — repeating them is safe. |
| `POST` (create) | 0 | **Not** retried automatically — a retried POST after a dropped response could create the resource twice. Failures surface as a normal form error instead ("Could not add the plant. Please try again."), letting the user retry explicitly. |

On top of that:

- **Streaming**: each garden/plant list is wrapped in its own `<Suspense>` boundary
  (`app/gardens/page.tsx`, `app/gardens/[gardenId]/page.tsx`) with a skeleton fallback, so the
  page shell and header render immediately instead of blocking on the slowest fetch.
- **`loading.tsx` / `error.tsx` per route segment**: a route-level loading skeleton covers the
  top-level `await` in each page, and an error boundary with a "Try again" button catches the
  residual ~0.1% of reads that still fail after retries, rather than showing Next's default error
  screen.
- **Optimistic capacity feedback**: `PlantSurfaceAreaField` computes overcrowding client-side
  using `checkGardenCapacity` as the user types, and disables the submit button — so an obviously
  doomed submission never has to make the round trip at all.

## Caching strategy

Reads (`getGardens`, `getGardenById`, `getPlantsByGardenId`, `getPlantById` in
`libs/web/data-access-*`) use Next's Data Cache with tags:

```ts
next: { tags: ['gardens'], revalidate: 60 }
```

Server Actions call `revalidateTag` after a successful mutation — targeted, not a blanket
`revalidatePath`:

- create/update/delete a garden → `revalidateTag('gardens')` + `revalidateTag('garden-{id}')`
- create/update/delete a plant → `revalidateTag('garden-{id}-plants')` +
  `revalidateTag('garden-{id}')` (the garden detail page shows a capacity summary that depends on
  the plant list)

The `revalidate: 60` is a safety-net window on top of tag invalidation, in case a mutation happens
through another client that bypasses our Server Actions (Bruno, another browser tab).

## The overcrowding rule

`surfaceAreaRequired` summed across a garden's plants must not exceed `totalSurfaceArea`. This is
enforced in two places on purpose:

1. **Server-side** (`apps/api/src/app/services/plant.service.ts`) — the authority. It's the only
   thing that can actually reject a request.
2. **Client-side** (`PlantSurfaceAreaField` in `feature-plants`) — a live preview using the exact
   same `checkGardenCapacity` function from `shared/domain`, purely for instant feedback and to
   avoid a wasted round trip to a backend that's slow by design.

## Testing

Focused on business logic and resilience, not markup — matching the case's "useful test coverage
of critical business logic" requirement:

- `libs/shared/domain` — the capacity/overcrowding calculation (edge cases: exact fit, updating a
  plant in place, moving a plant between gardens)
- `libs/shared/api-contracts` — schema edge cases (humidity boundaries 0/100, the
  latitude-and-longitude-together-or-neither rule)
- `libs/web/api-client` — the backoff formula, and `resilientFetch` under fake timers: succeeds
  first try, retries a 500 then succeeds, gives up after exhausting retries, doesn't retry
  non-retryable 4xx, retries network errors, times out via `AbortController`
- `libs/web/data-access-gardens` / `data-access-plants` — Server Actions with a mocked
  `resilientFetch` + `next/cache`: validation short-circuits before hitting the network, correct
  cache tags are revalidated per mutation, backend error messages surface through `ActionResult`
- `libs/web/ui` / `feature-plants` / `feature-gardens` — a couple of component tests for the
  actual logic-bearing pieces (`cn`'s Tailwind-conflict resolution, the live capacity meter's
  overcrowding detection, the delete-confirmation flow) rather than every presentational component
- `apps/web-e2e` — one Playwright happy path against the real (flaky) backend: create a garden,
  attempt to overcrowd it (blocked client-side), add a plant that fits, verify the capacity
  summary updates. Configured with `retries: 2` at the test level specifically because POSTs
  aren't auto-retried by the app — this is the one place a real 500 can still surface, and during
  development it genuinely did (and the test's own retry absorbed it, same as a user hitting
  refresh would).

Run everything with `npx nx run-many -t test typecheck lint` / `npx nx e2e web-e2e`.

## Bonus: making the API faster (theoretical)

The case flags the API as intentionally slow and asks for a theoretical speed-up for frequently
used data. What's implemented today (Next's per-instance Data Cache with tag invalidation) covers
a single server instance. Beyond that:

- **Shared cache (Redis)**: swap the Data Cache for a Redis-backed cache adapter shared across
  instances, keyed the same way (`gardens`, `garden-{id}`, `garden-{id}-plants`), so a cache warmed
  by one instance benefits all of them — necessary once the app runs on more than one server.
- **`stale-while-revalidate`**: serve the cached list immediately while a background refresh runs,
  for read-heavy views like the gardens list.
- **Backend-side caching** (`Cache-Control` / `ETag` on `GET /gardens`, `GET /plants/garden/:id`):
  today the client can't tell the difference between "fresh" and "5 seconds old" data from the
  API's own headers. Backend-side conditional requests would let the client skip the 200–2000ms
  delay entirely on a 304.
- **A combined endpoint**: `GET /gardens/:id` and `GET /plants/garden/:id` are two separate
  round trips for what the garden detail page always needs together. A `GET /gardens/:id?include=plants`
  (or a dedicated aggregate endpoint) would halve the request count for that page — currently
  worked around client-side with `Promise.all` where possible, but only after the garden page
  itself already resolved.

## Bonus: authentication & authorization (theoretical)

The bundled backend has no auth plugin — routes are open, and the case's "given token" isn't
validated anywhere in this fork. What's already in place: `authHeaders()` in
`libs/web/api-client` attaches `Authorization: Bearer <API_AUTH_TOKEN>` from a server-only env var
— the token never reaches the client bundle, since every fetch happens in Server
Components/Actions.

A full implementation would add:

- **Real login/registration flows** using the existing `POST /users` as a starting point, with
  passwords hashed server-side (bcrypt/argon2) and a dedicated `POST /auth/login` issuing a
  session.
- **httpOnly session cookies** (or short-lived JWT + refresh token) set by the backend, read in
  `middleware.ts` in `apps/web` to guard every `/gardens/*` route and redirect unauthenticated
  users to `/login`.
- **`userId` scoping on the backend** — `gardenRepository.findAll()` currently returns every
  garden in the database regardless of who's asking. Every garden/plant query and mutation would
  need to filter/authorize by the authenticated user's id, which the current schema (no
  `userId` column on `garden`) doesn't yet support.
- **CSRF protection** on Server Actions if moving away from same-origin cookies, though Next's
  built-in Server Action origin checking covers the common case already.

## Known limitations / what I'd do next

- No pagination on `GET /gardens` — fine at demo scale, would need `?page=`/`?limit=` on the
  backend plus cursor-based fetching for a real user with many gardens.
- The e2e suite covers one happy path; a fuller suite would add a dedicated "server rejects
  overcrowding" case that bypasses the client-side guard (e.g. via a direct API call) to prove the
  backend validation independently of the UI.
- `users` has no UI at all — out of scope per the case (a static token is provided instead of a
  login flow), but see [Auth](#bonus-authentication--authorization-theoretical) for the plan.

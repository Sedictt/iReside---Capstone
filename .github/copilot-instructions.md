---
description: Workspace instructions for the iReside repository
---

# iReside Workspace Instructions

Use these instructions when working anywhere in this repository.

## Project Snapshot

- Next.js 16 App Router with React 19 and TypeScript
- Supabase for auth, database, storage, and realtime features
- Tailwind CSS 4, Radix UI, Framer Motion, Leaflet, Chart.js, Zod, React Hook Form
- Feature areas include tenant, landlord, admin, AI assistant, messaging, leases, billing, maintenance, and map search

## Source of Truth

- Prefer the implementation and the docs over assumptions
- Use [README.md](../README.md) for the high-level product summary and setup
- Use [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for system structure and data flow
- Use [docs/API_GUIDE.md](../docs/API_GUIDE.md) and [openapi.json](../openapi.json) for API behavior
- Use [docs/list-of-features.md](../docs/list-of-features.md) and [docs/functional-requirements.md](../docs/functional-requirements.md) for functional scope
- Use [.agent/workflows/](../.agent/workflows/) for task-specific workflow guidance

## Working Rules

- Keep changes minimal and aligned with the existing feature structure under `src/app`, `src/components`, `src/lib`, and `src/hooks`
- Preserve role-based boundaries between tenant, landlord, visitor, and admin flows
- Treat Supabase RLS and auth as core constraints; do not weaken access control
- For AI features, preserve fallback behavior when external services are unavailable
- For realtime features, clean up subscriptions and avoid leaking listeners
- For data-heavy features, validate inputs on the client and server
- Prefer server-side or API-route handling for sensitive actions such as payments, lease actions, and admin review updates

## Commands

- `npm run dev` starts the local app
- `npm run build` creates a production build
- `npm run start` runs the built app
- `npm run lint` runs ESLint
- `npm run test` runs Vitest

## Tooling Notes

- ESLint uses flat config, so use `npx eslint <file1> <file2>` for scoped checks
- Avoid `eslint --file`, which is not valid in this repo
- Prefer existing scripts and conventions before adding new tooling

## Editing Expectations

- Follow the repository's current code style and component organization
- Avoid duplicating information that already lives in the docs; link to it instead
- Keep documentation current when behavior changes
- When adding new work, check whether an existing workflow in [.agent/workflows/](../.agent/workflows/) already covers the task

## When To Ask Questions

- Ask for clarification if the task could affect auth, data isolation, billing, leases, or deployment behavior
- Ask before changing schemas, migrations, or public API contracts unless the request is explicit
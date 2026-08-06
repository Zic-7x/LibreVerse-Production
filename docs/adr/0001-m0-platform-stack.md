# ADR 0001: M0 platform stack

## Status

Accepted

## Context

Milestone 0 requires a runnable local stack, migration pipeline, backend shell, shared packages, and CI. No business features yet. JWT vs session and WebSocket library are deferred to M1 and M6.

## Decision

| Area | Choice |
|------|--------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript (strict) |
| Monorepo | npm workspaces (`backend`, `packages/*`) |
| HTTP server | Fastify 5 |
| Logging | Pino (via Fastify) |
| PostgreSQL client | `pg` (no ORM in M0) |
| Migrations | Versioned SQL in `database/migrations/` applied via `npm run db:migrate` |
| Local database | Native PostgreSQL 18+ (no container runtime) |
| Unit tests | Vitest |
| Lint | ESLint + TypeScript ESLint |
| CI | GitHub Actions: install, lint, test |

## Consequences

- Backend composition root wires config, logger, DB pool, and HTTP routes in `backend/src/bootstrap/`.
- Domain layer remains empty of framework imports; health check DB probe lives in infrastructure.
- Mobile and admin stay unimplemented until M15/M16.
- M1 should add ADR 0002 for access token model (JWT vs opaque session).

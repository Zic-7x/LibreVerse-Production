# Project Monorepo

Multi-surface application organized as a monorepo with **Clean Architecture** boundaries.

## Structure

| Directory | Purpose |
|-----------|---------|
| [`mobile/`](mobile/) | Mobile client application |
| [`backend/`](backend/) | API server and business logic |
| [`admin/`](admin/) | Admin dashboard (web) |
| [`database/`](database/) | Schema, migrations, seeds, and DB scripts |
| [`docs/`](docs/) | Architecture, API, and project documentation |
| [`infrastructure/`](infrastructure/) | Terraform, Kubernetes, CI/CD |
| [`packages/`](packages/) | Shared libraries (types, utils, domain core) |

## Clean Architecture Layers

Each application (`mobile`, `backend`, `admin`) follows the same dependency rule:

```
presentation → application → domain ← infrastructure
```

- **Domain** — Entities, value objects, repository interfaces, domain services. No external dependencies.
- **Application** — Use cases, DTOs, mappers. Orchestrates domain logic.
- **Infrastructure** — Database, HTTP clients, storage, messaging. Implements domain/application interfaces.
- **Presentation** — UI, controllers, routes, navigation. Entry points only.

Dependencies always point inward. The domain layer must not depend on outer layers.

## Getting Started (M0)

Stack choices are recorded in [`docs/adr/0001-m0-platform-stack.md`](docs/adr/0001-m0-platform-stack.md).

1. `cp .env.example .env`
2. `npm install`
3. Install and start PostgreSQL, then apply migrations — see [`database/README.md`](database/README.md)
4. `npm run dev:backend` then `curl http://127.0.0.1:3000/health`

Business features begin at milestone M1 (auth).

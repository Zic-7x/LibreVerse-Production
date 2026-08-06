# Shared Packages

Cross-cutting libraries consumed by `mobile`, `backend`, and `admin`.

## Packages

| Package | Purpose |
|---------|---------|
| `shared-types/` | API contracts, enums, shared DTO shapes |
| `shared-utils/` | Pure utility functions with no I/O |
| `domain-core/` | Shared domain entities and value objects used by multiple surfaces |

## Dependency Rule

Shared packages must not import from `apps/` (mobile, backend, admin). They sit at the bottom of the dependency graph.

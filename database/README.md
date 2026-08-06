# Database

Database artifacts kept separate from application runtime code.

## Layout

| Path | Purpose |
|------|---------|
| `migrations/` | Versioned schema changes (up/down) |
| `seeds/` | Development and test seed data |
| `schemas/` | Canonical schema definitions or ERD sources |
| `scripts/` | One-off maintenance and ops scripts |
| `functions/` | Stored procedures and DB functions |
| `views/` | Database views |

## Local PostgreSQL setup

This project uses a **native PostgreSQL** install (no Docker).

1. Install [PostgreSQL 18+](https://www.postgresql.org/download/) and ensure the server is running.
2. Create a database and role (adjust names/passwords to match `.env`):

```sql
CREATE USER platform WITH PASSWORD 'platform';
CREATE DATABASE platform OWNER platform;
```

On Windows, you can run this via `psql -U postgres`, or use pgAdmin.

3. Copy root `.env.example` to `.env` and set `DATABASE_URL`:

```
DATABASE_URL=postgresql://platform:platform@127.0.0.1:5432/platform
```

4. Apply migrations from the repository root:

```bash
npm run db:migrate
```

Migrations are tracked in the `schema_migrations` table. Re-running `db:migrate` is safe (already-applied versions are skipped).

## Supabase Storage Provisioning

When using Supabase for object storage:
1. Open the Supabase Dashboard -> SQL Editor.
2. Run the SQL script in `database/supabase_schema.sql` to initialize the storage buckets (`media`, `posts`, `reels`, `stories`, `avatars`, `attachments`) and their access policies.
3. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) are configured in `.env`.

## Conventions

- Migrations are the source of truth for schema evolution.
- Application ORM models in `backend/src/infrastructure/persistence/models/` map to tables defined here.
- Never embed business logic in migrations beyond structural changes.

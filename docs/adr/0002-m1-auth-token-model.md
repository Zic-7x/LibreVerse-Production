# ADR 0002: M1 auth token model

## Status

Accepted

## Context

Milestone 1 requires account registration, login, session lifecycle, device binding, and auth middleware. ADR 0001 deferred the access-token model to M1.

## Decision

| Area | Choice |
|------|--------|
| Access token | Short-lived JWT (HS256), Bearer header, claims: `sub` (user id), `sid` (session id) |
| Refresh token | Opaque random token (32 bytes, base64url); only SHA-256 hash stored in `sessions.refresh_token_hash` |
| Refresh rotation | Each refresh revokes the prior session row and creates a new session with a new refresh token |
| Password hashing | Argon2id via `@node-rs/argon2` |
| Registration | Email and/or phone; user transitions to `active` immediately (no verification flow in M1) |
| Auth middleware | Verify JWT signature/expiry, load user, reject `suspended`, `deactivated`, `deleted` |

## Consequences

- `JWT_SECRET`, `JWT_ACCESS_TTL_SECONDS`, and `REFRESH_TOKEN_TTL_SECONDS` are required backend config.
- Clients store refresh tokens securely; access tokens are stateless but tied to a session id for revocation alignment.
- Suspending a user blocks new login/refresh; existing access tokens fail middleware until expiry (acceptable for M1; shorter TTL mitigates).
- Device `push_token` is stored on register/update but not used until M12.

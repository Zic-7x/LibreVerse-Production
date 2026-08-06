# ADR 0003: Mobile platform stack & foundation (FM0)

## Status

Accepted

## Context

Milestone 0 (FM0) establishes the mobile platform architecture for iOS and Android native clients. The backend APIs (M1–M14) follow Clean Architecture and REST/WebSocket contracts. The mobile codebase must maintain clean separation between business logic/use cases and presentation/framework adapters, while providing a runnable foundation with theme tokens, navigation controllers, environment configurations, and error boundaries.

## Decision

| Area | Choice |
|------|--------|
| Target Runtime | React Native / Expo SDK (iOS & Android) |
| Architecture Pattern | Clean Architecture (`domain/` -> `application/` -> `infrastructure/` -> `presentation/`) |
| Shared Business Logic | `@platform/mobile` workspace package (framework-agnostic TS) |
| Navigation Architecture | State-driven `AppShellController` tab & stack coordinator |
| State Management | Thin presentation controllers with pub/sub event subscriptions (`AppShellController`, `ToastManager`) |
| API Layer | Lightweight HTTP fetch client (`ApiClient`) with Bearer auth interceptor & health checks |
| Secure Storage | Adapter pattern (`TokenStorage` interface) -> Keychain (iOS) / Keystore (Android) / In-Memory (Dev/Tests) |
| Theme System | Dark mode baseline token scale (colors, typography, spacing, border radii) |
| Testing | Vitest unit & integration tests with mocked repositories |

## Consequences

- Business logic, domain entities, and HTTP repositories live in `@platform/mobile` without direct dependencies on `react-native` UI modules.
- UI wrappers (Expo / React Native components) consume screen controllers (`AuthScreen`, `ChatScreen`, `AppShellController`) and UI primitives (`ToastManager`, `ErrorBoundary`).
- Environment configuration supports `development`, `staging`, and `production` backend base URLs.
- Health checks connect directly to `GET /health` on the backend API.

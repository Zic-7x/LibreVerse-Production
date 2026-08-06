# Mobile App

Mobile client application structured with Clean Architecture.

## Layer Map

```
src/
├── domain/           # Core business rules (no framework imports)
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/ # Interfaces only
│   └── services/
├── application/      # Use cases and orchestration
│   ├── use-cases/
│   ├── dto/
│   └── mappers/
├── infrastructure/   # External implementations
│   ├── api/
│   ├── storage/
│   └── services/
├── presentation/     # UI layer
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   └── hooks/
└── shared/           # Cross-layer utilities
    ├── constants/
    └── utils/
```

## Dependency Rule

`presentation` → `application` → `domain` ← `infrastructure`

Implement repository interfaces from `domain/` inside `infrastructure/`. Inject them into use cases via the application layer.

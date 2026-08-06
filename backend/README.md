# Backend

API server with Clean Architecture. HTTP/WebSocket adapters live in presentation; business rules stay in domain.

## Layer Map

```
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/   # Interfaces
│   ├── services/
│   └── events/
├── application/
│   ├── use-cases/
│   ├── dto/
│   ├── interfaces/
│   └── mappers/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/  # Concrete implementations
│   │   └── models/        # ORM / DB models
│   ├── external/
│   ├── messaging/
│   ├── config/
│   └── logging/
└── presentation/
    ├── http/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── routes/
    │   └── validators/
    └── websocket/
```

## Dependency Rule

Controllers call use cases. Use cases depend on domain interfaces. Infrastructure implements those interfaces and is wired at composition root (bootstrap/DI).

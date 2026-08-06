# Admin Dashboard

Web-based admin interface using the same Clean Architecture layers as the mobile app.

## Layer Map

```
src/
├── domain/
│   ├── entities/
│   └── repositories/
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── mappers/
├── infrastructure/
│   ├── api/
│   ├── auth/
│   └── storage/
├── presentation/
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   ├── routes/
│   └── hooks/
└── shared/
    ├── constants/
    └── utils/
```

## Notes

- Prefer shared types from `packages/shared-types` for API contracts aligned with the backend.
- Auth tokens and session handling belong in `infrastructure/auth`, not in presentation components.

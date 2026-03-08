# API Prisma Schema Layout

## Structure

- `schema/00-base.prisma`: Shared `generator` and `datasource` blocks.
- `schema/models/*.prisma`: Model definitions grouped by domain.
- `migrations/`: Migration history (unchanged by schema file layout refactors).

## Model File Conventions

- Place all model declarations under `schema/models/`.
- Prefer one file per bounded context (for example, `auth.prisma`, `greeting.prisma`).
- Keep relation field names stable unless the change intentionally updates schema behavior.
- Do not duplicate `generator` or `datasource` blocks in model files.

## Prisma Workflow

Run Prisma commands from `apps/api`:

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

These scripts use `prisma.config.ts`, which points to `prisma/schema` and `prisma/migrations`.

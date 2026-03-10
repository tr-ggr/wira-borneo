# Ticket Guidelines (Wira-Borneo)

This guide defines how to write tickets in this monorepo.

## Non-Negotiable Rules

1. One ticket = one problem only.
2. All tickets live in `tickets/`.
3. Use this stack context: Next.js apps (`admin`, `mobile`, `tracker`) + NestJS API + Prisma + generated API client.

## Required Ticket Format

Use exactly these sections:

```markdown
# <Area + action title>

**[PRIORITY]** or **[CRITICAL]** (optional)

## Problem
<2-4 short sentences on current vs target state>

## Potentially Related Files
- [link](../apps/...#Lx-Ly) - <why this file matters>

## What to Fix
1. <specific change>
2. <specific change>
3. <specific change>

## Acceptance Criteria
- <testable outcome>
- <testable outcome>
- <testable outcome>
```

Constraints:

- `Potentially Related Files`: 3-5 items max.
- `What to Fix`: 3-7 items max.
- `Acceptance Criteria`: 3-5 bullets max.
- No sub-bullets.

## File Naming

Pattern:

```text
{area}-{feature}.md
```

Area prefixes:

- `admin-` for `apps/admin` work
- `client-` for `apps/mobile` or `apps/tracker` user-facing flows
- `utils-` for infra, scripts, migrations, generated client, cross-cutting work

Examples:

```text
admin-warning-system-enhancements.md
client-help-request-system.md
utils-llm-server-integration.md
```

## Codebase-Specific File References

Use links relative to `tickets/`.

Backend (NestJS API):

- Controllers: `../apps/api/src/modules/**/**.controller.ts`
- Services: `../apps/api/src/modules/**/**.service.ts`
- Modules: `../apps/api/src/modules/**/**.module.ts`
- DTOs: `../apps/api/src/modules/**/dto/*.ts`
- Auth guards/decorators: `../apps/api/src/modules/auth/`

Database (Prisma):

- Auth models: `../apps/api/prisma/schema/models/auth.prisma`
- Domain models: `../apps/api/prisma/schema/models/disaster-response.prisma`
- Migrations: `../apps/api/prisma/migrations/`

Frontend (Next.js app router):

- Route pages: `../apps/<app>/src/app/**/page.tsx`
- App layout/providers: `../apps/<app>/src/app/layout.tsx`, `../apps/<app>/src/app/providers.tsx`
- Screen/components: `../apps/mobile/src/components/`, `../apps/admin/src/app/`

Generated client:

- `../packages/api-client/src/generated/` is generated; do not request manual edits there.

## Ticket Author Checklist

Before submitting, confirm:

- Scope is single-problem.
- Roles/permissions are explicit (`public`, `authenticated`, `admin`, `volunteer`, etc.).
- DB impact is explicit (no schema change vs new migration).
- API impact is explicit (endpoint/DTO change or no API change).
- If API changes, ticket states that client regeneration is required (`npm run api:client:generate`).
- Acceptance criteria are testable and concise.

## Reviewer Checklist

Reject ticket if any is true:

- Missing required sections.
- Vague fixes (for example: "improve UI", "fix backend").
- Missing path references for touched layers.
- Multiple unrelated problems in one ticket.

## Example (Compliant)

```markdown
# Admin export damage report PDF

## Problem
Admin map shows bounding-box damage data but has no PDF export for LGU reporting.

## Potentially Related Files
- [page.tsx](../apps/admin/src/app/map/page.tsx) - export trigger UI
- [admin-operations.service.ts](../apps/api/src/modules/disaster-response/admin-operations/admin-operations.service.ts) - report data
- [disaster-response.prisma](../apps/api/prisma/schema/models/disaster-response.prisma) - data model

## What to Fix
1. Add admin PDF export endpoint using selected bounds
2. Generate PDF with totals and timestamp
3. Connect map export button to endpoint
4. Restrict export to admin session

## Acceptance Criteria
- Admin can export PDF for selected bounds
- PDF includes totals and timestamp
- Non-admin cannot export
```

---

**Last updated:** March 9, 2026
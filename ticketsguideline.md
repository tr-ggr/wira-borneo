# Ticket Guidelines

This document explains how to write and format tickets for the CIT-U Intramurals 2026 project.

## When to Create a Ticket

Create a ticket when you discover or plan:
- A bug or unexpected behavior
- A missing feature or user-facing capability
- A refactoring need
- A technical debt issue
- A test case or edge case

**One ticket per problem.** Each file should address a single, self-contained issue.

## Ticket Format

All tickets should follow this standard structure:

### 1. Title (H1)

Clear, action-oriented title describing the problem or feature.

```markdown
# Remove SPORTS link from Navbar

# Implement Login/Register Feature

# Add Daily Facebook Updates Banner to Home Page
```

### 2. Metadata (Optional)

For high-priority tickets, add priority marker:

```markdown
**[PRIORITY]**

or

**[CRITICAL]**
```

### 3. Problem Section (H2)

Explain **why** this ticket exists. Describe:
- What is broken or missing
- Impact on users or development
- Current state vs. desired state

**Examples:**

```markdown
## Problem

The navbar currently displays "Sports" and "Teams" links that should be removed 
from the public navigation.

---

## Problem

Currently, the application has Supabase auth setup but no public login/register UI. 
Users cannot create accounts.
```

### 4. Potentially Related Files (H2)

List file paths that are relevant to this ticket. Include:
- **Backend:** Server actions ([actions/X.ts]()), routes, migrations
- **Frontend:** Components ([components/X/]()), hooks, utilities
- **Database:** Schema files, migrations

**Format:**

```markdown
## Potentially Related Files

- [components/public/navbar.tsx](../app/components/public/navbar.tsx) — Line 18–20: navLinks array
- [app/(public)/sports/](../app/app/(public)/sports/) — Route page
- [actions/sport.ts](../app/actions/sport.ts) — Server actions
```

**Guidelines:**
- Use relative paths starting with `../app/` (from `/tickets/` directory)
- Mention line numbers or sections for clarity
- Include brief description of what's in each file

### 5. What to Fix (H2)

Ordered list of concrete implementation steps.

```markdown
## What to Fix

1. Remove `/sports` and `/teams` from navLinks array in navbar.tsx
2. Verify routes still accessible via direct URL
3. Update mobile menu navigation
4. Test navigation state preservation
```

### 6. Acceptance Criteria (H2)

Testable conditions that define "done." Use narrative or bullet points.

```markdown
## Acceptance Criteria

- "Sports" link is not visible in desktop navbar
- "Teams" link is not visible in mobile menu
- Routes accessible via direct URL (no 404)
- All navigation highlights work after change
```

## File Naming

Use this format:

```
{area}-{feature}.md
```

Where `{area}` is:
- `client-` (public-facing UI, client components)
- `admin-` (admin dashboard)
- `utils-` (utilities, seeds, scripts, infrastructure)

**Examples:**

```
client-navbar-remove-sports-teams.md
client-general-login-register.md
admin-general-pdf-export.md
utils-seed-script.md
```

## Code References

When referencing code:
- Use markdown links: `[filename.tsx](../app/path/to/filename.tsx)`
- Include line numbers: `../app/components/navbar.tsx#L18-L20`
- Avoid backticks for file paths in display text
- Describe what's in the file (not a code dump)

## Tips for Writing Good Tickets

### ✅ DO

- Focus on **one problem** per ticket
- Be **specific** about files and line numbers
- List implementation steps in logical order
- Write acceptance criteria that are **testable**
- Mention breaking changes or dependencies
- Reference related tickets if applicable

### ❌ DON'T

- Mix multiple unrelated features
- Use vague language ("fix stuff", "improve UI")
- Assume technical context (explain the "why")
- Forget acceptance criteria
- Include full code snippets (link instead)
- Create tickets for questions (ask in chat first)

## Priority Levels

Use these markers for urgent tickets:

| Level | Marker | Usage |
|-------|--------|-------|
| High | `**[PRIORITY]**` | Feature blocks other work, critical for MVP |
| Critical | `**[CRITICAL]**` | Production bug, system broken |
| Normal | (no marker) | Standard feature or bug |

## Example Ticket

```markdown
# Implement Community Post Approval System

## Problem

Community posts are currently visible without moderation. Admins have no way to 
review or reject inappropriate discussions.

## Potentially Related Files

- [supabase/migrations/20260216100000_add_threads.sql](../app/supabase/migrations/20260216100000_add_threads.sql)
- [actions/thread.ts](../app/actions/thread.ts)
- [components/admin/](../app/components/admin/)

## What to Fix

1. Add `is_approved` boolean to threads table
2. Make new threads default to `is_approved = false`
3. Create approval server actions
4. Build admin moderation panel
5. Filter unapproved from public view

## Acceptance Criteria

- Admin can see pending threads in dashboard
- Unapproved posts hidden from public
- Admin can approve/reject posts
- Notification shows pending count
```

## Directory Structure

All tickets live in `/tickets/` at workspace root:

```
cituintramurals-2026/
├── tickets/
│   ├── client-navbar-remove-sports-teams.md
│   ├── client-general-login-register.md
│   ├── admin-general-pdf-export.md
│   ├── utils-seed-script.md
│   └── ...
├── ticketsguideline.md          (this file)
└── ...
```

## Project Context

Remember that this project uses:

- **Framework:** Next.js 16 + React 19 (App Router)
- **Language:** TypeScript (strict)
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **State:** TanStack React Query
- **Forms:** React Hook Form + Zod
- **UI:** shadcn/ui + Tailwind CSS v4
- **Components:** Atomic pattern (ui/ for primitives, components/ for composites)
- **Server Logic:** Next.js server actions (not tRPC/API routes)

See [CLAUDE.md](../CLAUDE.md) for full tech stack and conventions.

---

**Last updated:** February 21, 2026

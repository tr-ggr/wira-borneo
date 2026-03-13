# WiraBorneo

**Youtube Demo Link** - [Youtube Video](https://www.youtube.com/watch?v=tl6uU0gq5yw)

**WIRA** (Woven Intelligence for Regional Alertness) is an ASEAN disaster response platform: preparedness, during-disaster (pins, help requests, damage reports, volunteer/asset registry), and post-disaster (damage reports, relief tracking). Design is batik-inspired, offline-first, and clarity-first — see [docs/design-guidelines.md](docs/design-guidelines.md).

This repo is an **Nx monorepo** with shared packages and multiple apps.

---

## 1. Project overview

| App                       | Tech                        | Purpose                                                                                                   |
| ------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| **API**                   | NestJS, Prisma, Better Auth | REST API, auth, disaster-response modules, file uploads via Supabase                                      |
| **Admin**                 | Next.js                     | Dashboards, maps, registries, damage report/volunteer review                                              |
| **Tracker**               | Next.js                     | Aid shipment tracking, blockchain (Polygon), relief zones                                                 |
| **Mobile**                | Next.js / React Native      | Resident-facing: map, forecast, pins, help requests, flood simulation, damage reports, LLM assistant      |
| **LLM Server**            | Python/Flask                | SEA-Lion / Gemini gateway for AI assistant                                                                |
| **Hazard routing server** | Python/Flask                | Hazard-aware routing for AI flood simulation (risk/hazard route); in-repo at `apps/hazard-routing-server` |

Set `HAZARD_ROUTING_SERVER_URL` in the API `.env` (e.g. `http://localhost:5001`) when using the flood simulation risk/hazard route.

---

## 2. Prerequisites

- **Node.js** and **npm** (workspace root)
- **Python** (for LLM server; use `uv` or venv as in `apps/llm-server`)
- **Supabase account** for database and storage
- (Optional) **WalletConnect** project ID for Tracker blockchain features

---

## 3. Supabase setup

### 3.1 Database (PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. In **Dashboard → Project Settings → Database**:

- **Connection string (URI):**
  - Use **Transaction pooler** (port 6543) for `DATABASE_URL` (add `?pgbouncer=true` if required).
  - Use **Direct/Session** (port 5432) for `DIRECT_URL` — required for Prisma migrations and seed.

3. **PostGIS** is used by building/evacuation data; migrations in `apps/api/prisma/migrations/` enable it where needed.

### 3.2 Storage bucket (API uploads)

1. In **Storage**, create a bucket (e.g. `wira-borneo`). The API uses it for:

- Damage report photos: path prefix `damage-reports/`
- Asset photos: path prefix `assets/`

2. Configure the bucket for **public read** if the app serves image URLs directly (the API returns public URLs from Supabase).
3. In **Project Settings → API**, copy **Project URL** and **service_role** key for the API env (see Environment variables).

---

## 4. Repository setup

```sh
git clone <repo-url>
cd wira-borneo
npm install
```

**One-time per app:**

- **API:** `cp apps/api/.env.example apps/api/.env` — fill in all values (see Environment variables). Then run Prisma generate and migrate (see Database (Prisma)).
- **Tracker:** `cp apps/tracker/.env.local.example apps/tracker/.env.local` — fill in API URL, Supabase, Polygon, WalletConnect.
- **Admin:** `cp apps/admin/.env.local.example apps/admin/.env.local` — set `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:3333`).
- **LLM server:** Ensure Python env is set up; set `WIRA_INTERNAL_SECRET` to match the API’s `LLM_INTERNAL_SECRET`.
- **Hazard routing server:** Optional. Copy `apps/hazard-routing-server/.env.example` to `apps/hazard-routing-server/.env` and set `NEIGHBORHOOD_DATA_PATH` if the graph data is not under `wira-borneo/wira-resources/AI Simulation/neighborhood_data.json` (e.g. in a monorepo use `../../wira-resources/AI Simulation/neighborhood_data.json`).

---

## 5. Environment variables

### 5.1 API (`apps/api/.env`)

Create from `apps/api/.env.example`.

| Variable                             | Required     | Description                                                                 |
| ------------------------------------ | ------------ | --------------------------------------------------------------------------- |
| `DATABASE_URL`                       | Yes          | PostgreSQL connection string (Supabase pooler for runtime)                  |
| `DIRECT_URL`                         | For Supabase | Direct connection for migrations/seed (Session, port 5432)                  |
| `AUTH_SECRET`                        | Yes          | Long random secret for Better Auth                                          |
| `AUTH_BASE_URL`                      | Yes          | API origin (e.g. `http://localhost:3333`)                                   |
| `AUTH_TRUSTED_ORIGINS`               | Optional     | Comma-separated origins (defaults include 3192, 4444, 8888)                 |
| `LLM_SERVER_URL`                     | Yes          | LLM server URL (e.g. `http://localhost:5000`)                               |
| `LLM_INTERNAL_SECRET`                | Yes          | Must match LLM server’s `WIRA_INTERNAL_SECRET`                              |
| `HAZARD_ROUTING_SERVER_URL`          | No           | Hazard server URL (e.g. `http://localhost:5001`) for flood simulation route |
| `SUPABASE_URL`                       | For uploads  | Supabase project URL                                                        |
| `SUPABASE_SERVICE_ROLE_KEY`          | For uploads  | Service role key                                                            |
| `SUPABASE_BUCKET`                    | Optional     | Bucket name (default `wira-borneo`)                                         |
| `DAMAGE_REPORT_CONFIDENCE_THRESHOLD` | Optional     | 0–1 (default 0.7)                                                           |
| `ADMIN_USER_IDS`                     | Optional     | Comma-separated user IDs for admin-only operations                          |

Required if the assistant/LLM flow is used.

### 5.2 Admin (`apps/admin`)

| Variable                   | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL (e.g. `http://localhost:3333`). No trailing `/api` — the client adds the path. |

Copy `apps/admin/.env.local.example` to `apps/admin/.env.local`.

### 5.3 Tracker (`apps/tracker`)

Copy `apps/tracker/.env.local.example` to `apps/tracker/.env.local`. Variables: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POLYGON_RPC_URL`, `NEXT_PUBLIC_RELIEF_CONTRACT_ADDRESS`, `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, `NEXT_PUBLIC_CHAIN_ID` (e.g. 80002 for Amoy).

### 5.4 Mobile (`apps/mobile`)

Uses shared `@wira-borneo/api-client`. If the app reads an API base URL from env (e.g. `NEXT_PUBLIC_API_BASE_URL`), set it to the same value as Admin/Tracker so it talks to the same API.

### 5.5 LLM Server (`apps/llm-server`)

See [apps/llm-server/README.md](apps/llm-server/README.md). Key: `SEA_LION_API_KEY`, `SEA_LION_BASE_URL`, `GEMINI_API_KEY`, `WIRA_API_BASE_URL` (default `http://localhost:3333`), `WIRA_INTERNAL_SECRET` (must match API’s `LLM_INTERNAL_SECRET`).

### 5.6 Hazard routing server (`apps/hazard-routing-server`)

See [apps/hazard-routing-server/README.md](apps/hazard-routing-server/README.md). Optional. Copy `apps/hazard-routing-server/.env.example` to `apps/hazard-routing-server/.env`. Set `NEIGHBORHOOD_DATA_PATH` only if the graph data is not at `wira-borneo/wira-resources/AI Simulation/neighborhood_data.json` (e.g. in a monorepo: `../../wira-resources/AI Simulation/neighborhood_data.json`). Default port: 5001.

---

## 6. Database (Prisma)

Schema is multi-file under `apps/api/prisma/schema/`; config in `apps/api/prisma.config.ts`. For Supabase, set `DIRECT_URL` for migrations/seed and `DATABASE_URL` (pooler) for runtime.

- **Validate:** `npm run prisma:validate`
- **Generate:** `npm run prisma:generate`
- **Migrate (dev):** `npm run prisma:migrate-dev` or `npm run migrate`
- **Migrate (deploy):** `npm run prisma:migrate:deploy` (run after generate)
- **Seed:** `npm run prisma:seed`
- **Deploy order:** Generate then migrate: `npx nx run api:prisma-prepare-deploy`

See [apps/api/prisma/README.md](apps/api/prisma/README.md) for schema layout and conventions.

---

## 7. Running the apps

| Service                   | Port | Command                                                             |
| ------------------------- | ---- | ------------------------------------------------------------------- |
| **API**                   | 3333 | `npm run api`                                                       |
| **Admin**                 | 3192 | `npm run admin`                                                     |
| **Tracker**               | 4444 | `npm run tracker`                                                   |
| **Mobile**                | 8888 | `npm run mobile`                                                    |
| **LLM Server**            | 5000 | `npm run llm-server`                                                |
| **Hazard routing server** | 5001 | `npm run hazard-routing-server` or `nx serve hazard-routing-server` |

**Suggested order:** (1) Apply migrations and optionally seed. (2) Start API. (3) If using assistant, start LLM server. (4) Start Admin, Tracker, Mobile in any order. (5) Optionally start hazard routing server for flood simulation (`npm run hazard-routing-server`).

**Local development URLs:**

- API: `http://localhost:3333/api`
- Admin: `http://localhost:3192`
- Tracker: `http://localhost:4444`
- Mobile (web): `http://localhost:8888`

---

## 8. Auth and OpenAPI

**Better Auth** (API): Set `AUTH_SECRET`, `AUTH_BASE_URL`, and optionally `AUTH_TRUSTED_ORIGINS` so admin/tracker/mobile origins are allowed. Endpoints under `/api`: sign-up, sign-in, sign-out, session. Protected routes require an active session.

**OpenAPI / API client:**

- **Swagger UI:** `http://localhost:3333/api/docs` when the API is running.
- **Generate typed client:** Start the API, then `npm run api:client:generate`. Client lives in `packages/api-client`; do not edit the generated file. Use `npm run api:client:generate:check` for a deterministic check.

---

## 9. Optional

- **Hazard routing server:** For AI flood simulation (green risk/hazard route), run the in-repo hazard server with `npm run hazard-routing-server` and set `HAZARD_ROUTING_SERVER_URL` in the API `.env` (e.g. `http://localhost:5001`). If unset or server is down, the hazard route returns null.
- **Building ingest:** `npm run ingest-building` (uses API’s `.env`; see `apps/api/scripts/ingest-building-profiles.ts`).

---

## 10. Links

- [Design guidelines](docs/design-guidelines.md)
- [Tracker setup (detailed)](TRACKER-SETUP.md)
- [API Prisma schema](apps/api/prisma/README.md)
- [LLM server](apps/llm-server/README.md)
- [Hazard routing server](apps/hazard-routing-server/README.md)
- [Youtube Video](https://www.youtube.com/watch?v=tl6uU0gq5yw)
- [Nx workspace](https://nx.dev) — run `npx nx graph` to explore the project graph.

---

## Nx: tasks, versioning, CI

Run any task with `npx nx <target> <project-name>`. Build: `npx nx build <project>`. Version/release: `npx nx release` (use `--dry-run` to preview). Keep TypeScript project references in sync: `npx nx sync` (manual), `npx nx sync:check` (CI). Connect to Nx Cloud: `npx nx connect`. Configure CI: `npx nx g ci-workflow`. [Install Nx Console](https://nx.dev/getting-started/editor-setup) for your editor.

---
